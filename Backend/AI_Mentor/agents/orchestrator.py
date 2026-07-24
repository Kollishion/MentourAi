from typing import Optional

from schemas.state import StudentState
from schemas.diagnostic import DiagnosticResult
from schemas.tutor import TutorResponse
from schemas.content import ContentMap
from agents.diagnostic_agent import diagnostic_agent
from agents.tutor_agents import tutor_agent

# Minimum mastery required in a prerequisite before the orchestrator
# will let the student move on to something that depends on it.
MASTERY_GATE = 0.6


def load_content_map(state: StudentState, content_map: ContentMap) -> None:
    """Populate the student's prerequisite map from a structured ContentMap."""
    for concept in content_map.concepts:
        if concept.prerequisites:
            state.prerequisites[concept.name] = list(concept.prerequisites)


def next_best_action(state: StudentState, target_concept: str) -> dict:
    """
    Given what the student wants to learn next, decide the single
    best next action - this implements your Recursion -> DP example
    directly: don't start DP if Recursion mastery is too low.
    """
    prereqs = state.prerequisites.get(target_concept, [])
    weak_prereqs = [p for p in prereqs if state.mastery_of(p) < MASTERY_GATE]

    if weak_prereqs:
        weakest = min(weak_prereqs, key=state.mastery_of)
        return {
            "action": "remediate_prerequisite",
            "concept": weakest,
            "reason": (
                f"{target_concept} requires {weakest}, but mastery is "
                f"only {state.mastery_of(weakest):.0%}."
            ),
        }

    if target_concept not in state.concept_mastery:
        return {
            "action": "run_diagnostic",
            "concept": target_concept,
            "reason": f"No prior data on {target_concept} yet.",
        }

    if state.mastery_of(target_concept) < MASTERY_GATE:
        return {
            "action": "run_diagnostic",
            "concept": target_concept,
            "reason": f"Mastery of {target_concept} is still low; keep diagnosing.",
        }

    return {
        "action": "transfer_problem",
        "concept": target_concept,
        "reason": f"Mastery of {target_concept} looks solid; test transfer to a new context.",
    }


def run_diagnostic_and_teach(
    state: StudentState,
    concept: str,
    question: str,
    student_answer: str,
    confidence: float,
) -> tuple[DiagnosticResult, Optional[TutorResponse]]:
    """
    One full turn: diagnose -> update state -> teach if there's a
    real gap. This is the function your API layer / frontend calls
    per student response.
    """
    diagnosis = diagnostic_agent(concept, question, student_answer, confidence)

    state.concept_mastery[concept] = diagnosis.mastery_score
    state.misconception_log.setdefault(concept, []).extend(
        m.type for m in diagnosis.misconceptions
    )

    tutoring: Optional[TutorResponse] = None
    if diagnosis.misconceptions or diagnosis.mastery_score < MASTERY_GATE:
        tutoring = tutor_agent(diagnosis)

    return diagnosis, tutoring