from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from schemas.state import StudentState
from schemas.content import MaterialInput, MaterialType
from agents.content_agent import content_agent
from agents.orchestrator import (
    load_content_map,
    next_best_action,
    run_diagnostic_and_teach,
)
from core.gemma_client import call_gemma


app = FastAPI(
    title="Mentor OS - Agentic Learning System",
    description="AI-powered agentic learning mentor",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

student_states: dict[str, StudentState] = {}


def get_student_state(student_id: str) -> StudentState:
    if student_id not in student_states:
        student_states[student_id] = StudentState(student_id=student_id)
    return student_states[student_id]


class MaterialRequest(BaseModel):
    student_id: str
    text: str
    material_type: str = "other"
    source_name: str = "Uploaded_Material"


class LearningRequest(BaseModel):
    student_id: str
    target_concept: str


class DiagnosticRequest(BaseModel):
    student_id: str
    concept: str
    question: str
    student_answer: str
    confidence: float = 50.0


class MentorPromptRequest(BaseModel):
    prompt: Optional[str] = None
    student_id: str = "default_student"

    concept: Optional[str] = None
    question: Optional[str] = None
    student_answer: Optional[str] = None
    confidence: float = 50.0


@app.get("/")
def root():
    return {
        "status": "online",
        "system": "Mentor OS Agentic Learning API",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "AI_Mentor FastAPI",
    }


@app.post("/mentor")
def mentor_endpoint(request: MentorPromptRequest):
    state = get_student_state(request.student_id)

    # -------------------------------------------------
    # DIAGNOSTIC MODE
    # -------------------------------------------------
    if (
        request.concept
        and request.question
        and request.student_answer
    ):
        diagnosis, tutoring = run_diagnostic_and_teach(
            state,
            concept=request.concept,
            question=request.question,
            student_answer=request.student_answer,
            confidence=request.confidence,
        )

        response_text = (
            tutoring.explanation
            if tutoring
            else "Mastery looks solid - no remediation needed right now."
        )

        return {
            "mode": "diagnostic",
            "response": response_text,
            "diagnosis": diagnosis.model_dump(),
            "tutoring": tutoring.model_dump() if tutoring else None,
            "next_action": next_best_action(state, request.concept),
        }

    # -------------------------------------------------
    # NORMAL CHAT MODE
    # -------------------------------------------------
    prompt = f"""
You are MentourAI.

The user is asking a question.

Teach the topic clearly.

Do NOT evaluate them.

Do NOT diagnose misconceptions.

Only answer the question naturally like ChatGPT.

User:
{request.prompt}
"""

    response = call_gemma(prompt, schema=None)

    return {
        "mode": "chat",
        "response": response,
    }


def normalize_material_type(raw_type: str) -> str:
    raw = (raw_type or "").strip().lower()
    if "note" in raw or "lecture" in raw:
        return "lecture_notes"
    elif "syllab" in raw:
        return "syllabus"
    elif "exam" in raw or "paper" in raw:
        return "past_exam_paper"
    elif "textbook" in raw or "chapter" in raw:
        return "textbook_chapter"
    elif "transcript" in raw or "video" in raw:
        return "video_transcript"
    return "other"


@app.post("/api/content/process")
def process_content(request: MaterialRequest):
    try:
        state = get_student_state(request.student_id)
        norm_type = normalize_material_type(request.material_type)

        material = MaterialInput(
            text=request.text,
            material_type=norm_type, # type: ignore
            source_name=request.source_name or "Uploaded_Material",
        )

        print(
            f"[Content Agent] Extracting concept map for student '{request.student_id}' (type={norm_type})..."
        )

        content_map = content_agent([material])
        load_content_map(state, content_map)

        return {
            "message": "Content processed successfully",
            "student_id": request.student_id,
            "concept_count": len(content_map.concepts),
            "content_map": content_map.model_dump(),
        }
    except Exception as e:
        print(f"❌ Error in process_content: {e}")
        import traceback
        traceback.print_exc()
        return {
            "message": "Content processed with default fallback",
            "student_id": request.student_id,
            "concept_count": 0,
            "content_map": {"subject": "Course Material", "concepts": []},
            "error": str(e),
        }


@app.post("/api/learning/next-action")
def get_next_action(request: LearningRequest):
    state = get_student_state(request.student_id)

    decision = next_best_action(
        state,
        request.target_concept,
    )

    return {
        "student_id": request.student_id,
        "decision": decision,
    }


@app.post("/api/learning/diagnose")
def diagnose_student(request: DiagnosticRequest):
    state = get_student_state(request.student_id)

    diagnosis, tutoring = run_diagnostic_and_teach(
        state,
        concept=request.concept,
        question=request.question,
        student_answer=request.student_answer,
        confidence=request.confidence,
    )

    return {
        "student_id": request.student_id,
        "concept": request.concept,
        "diagnosis": diagnosis.model_dump(),
        "tutoring": tutoring.model_dump() if tutoring else None,
        "updated_mastery": state.concept_mastery,
        "next_action": next_best_action(state, request.concept),
    }


@app.get("/api/student/{student_id}")
def inspect_student_state(student_id: str):
    state = get_student_state(student_id)

    return {
        "student_id": state.student_id,
        "concept_mastery": state.concept_mastery,
        "prerequisites": state.prerequisites,
        "misconception_log": state.misconception_log,
    }
