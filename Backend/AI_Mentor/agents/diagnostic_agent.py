import json
from prompts.diagnostic_prompt import DIAGNOSTIC_PROMPT
from schemas.diagnostic import DiagnosticResult
from core.gemma_client import call_gemma


def diagnostic_agent(
    concept: str,
    question: str,
    student_answer: str,
    confidence: float,
) -> DiagnosticResult:
    """
    One diagnostic turn: given a question + the student's answer and
    reasoning, figure out WHAT they actually understand vs. the
    specific misconception behind their mistake - not just right/wrong.
    """
    prompt = DIAGNOSTIC_PROMPT.format(
        concept=concept,
        question=question,
        student_answer=student_answer,
        confidence=confidence,
    )

    content = call_gemma(prompt, schema=DiagnosticResult.model_json_schema())

    try:
        data = json.loads(content)
        if isinstance(data, dict):
            # Normalize common alias keys if the model outputs alternate key names
            if "concept" not in data or not data["concept"]:
                data["concept"] = concept
            if "understood" not in data and "understanding" in data:
                val = data.pop("understanding")
                data["understood"] = [val] if isinstance(val, str) else list(val)
            if "misconceptions" not in data and "misconception" in data:
                val = data.pop("misconception")
                data["misconceptions"] = [val] if isinstance(val, dict) else list(val)
            if "confidence_calibration" not in data and "calibration" in data:
                data["confidence_calibration"] = {"calibration": data.pop("calibration")}

            return DiagnosticResult.model_validate(data)
    except Exception:
        pass

    try:
        return DiagnosticResult.model_validate_json(content)
    except Exception:
        # Emergency fallback instance to prevent API crash
        return DiagnosticResult(
            concept=concept,
            mastery_score=0.5,
            understood=[student_answer],
            next_action="Continue guided practice on " + concept,
        )

