from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from schemas.state import StudentState
from schemas.content import MaterialInput, MaterialType
from agents.content_agent import content_agent
from agents.orchestrator import load_content_map, next_best_action, run_diagnostic_and_teach


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
    material_type: MaterialType = "other"
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
        "version": "1.0.0"
    }

@app.post("/mentor")
def mentor_endpoint(request: MentorPromptRequest):
    state = get_student_state(request.student_id)

    concept = request.concept or "General Concept"
    question = request.question or request.prompt or "Explain concept"
    student_answer = request.student_answer or request.prompt or ""

    diagnosis, tutoring = run_diagnostic_and_teach(
        state,
        concept=concept,
        question=question,
        student_answer=student_answer,
        confidence=request.confidence,
    )

    response_text = tutoring.explanation if tutoring else "Mastery looks solid - no remediation needed right now."

    return {
        "response": response_text,
        "diagnosis": diagnosis.model_dump(),
        "tutoring": tutoring.model_dump() if tutoring else None,
        "next_action": next_best_action(state, concept),
    }


@app.post("/api/content/process")
def process_content(request: MaterialRequest):
    state = get_student_state(request.student_id)

    material = MaterialInput(
        text=request.text,
        material_type=request.material_type,
        source_name=request.source_name,
    )

    print(f"[Content Agent] Extracting concept map for student '{request.student_id}'...")

    content_map = content_agent([material])
    load_content_map(state, content_map)

    return {
        "message": "Content processed successfully",
        "student_id": request.student_id,
        "concept_count": len(content_map.concepts),
        "content_map": content_map.model_dump(),
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



