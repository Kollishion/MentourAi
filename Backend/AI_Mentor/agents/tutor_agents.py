import json
from prompts.tutor_prompt import TUTOR_PROMPT
from schemas.tutor import TutorResponse
from schemas.diagnostic import DiagnosticResult
from core.gemma_client import call_gemma


SEVERITY_RANK = {"high": 0, "medium": 1, "low": 2}


def choose_teaching_strategy(mastery_score: float) -> str:
    """Pick a teaching strategy from mastery level alone."""
    if mastery_score < 0.4:
        return "analogy"
    elif mastery_score < 0.7:
        return "guided_practice"
    elif mastery_score < 0.9:
        return "application"
    else:
        return "challenge_problem"


def tutor_agent(diagnostic_result: DiagnosticResult) -> TutorResponse:
    """
    Takes the DiagnosticResult produced by diagnostic_agent() and
    generates one scaffolded teaching intervention targeting the
    single highest-severity misconception.
    """
    strategy = choose_teaching_strategy(diagnostic_result.mastery_score)

    if diagnostic_result.misconceptions:
        primary = sorted(
            diagnostic_result.misconceptions,
            key=lambda m: SEVERITY_RANK.get(m.severity, 3),
        )[0]
        misconception_summary = f"{primary.type}: {primary.description}"
    else:
        misconception_summary = "None detected - reinforce and extend understanding."

    prompt = f"""{TUTOR_PROMPT}

Concept: {diagnostic_result.concept}
Teaching strategy to use: {strategy}
Primary misconception to address: {misconception_summary}
Mastery score: {diagnostic_result.mastery_score}
Confidence calibration: {diagnostic_result.confidence_calibration.calibration}
"""

    content = call_gemma(prompt, schema=TutorResponse.model_json_schema())

    try:
        data = json.loads(content)
        if isinstance(data, dict):
            response = TutorResponse.model_validate(data)
            response.teaching_strategy = strategy
            return response
    except Exception:
        pass

    try:
        response = TutorResponse.model_validate_json(content)
        response.teaching_strategy = strategy
        return response
    except Exception:
        return TutorResponse(
            teaching_strategy=strategy,
            misconceptions=misconception_summary,
            explanation=f"Review the foundational principles of {diagnostic_result.concept}.",
            socratic_question=f"Can you explain the main idea behind {diagnostic_result.concept} step-by-step?",
            analogy=f"Think of {diagnostic_result.concept} as breaking down a problem into manageable steps.",
            practice_question=f"Try writing a short example illustrating {diagnostic_result.concept}.",
            encouragement="Keep practicing! Everyday problem solving makes mental models stronger.",
        )
