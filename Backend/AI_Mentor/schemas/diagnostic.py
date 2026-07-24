from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class Misconception(BaseModel):
    type: str = "general"
    description: str = "Unspecified gap in understanding"
    severity: Literal["low", "medium", "high"] = "medium"


class ConfidenceCalibration(BaseModel):
    student_confidence: float = 50.0
    estimated_actual_understanding: float = 50.0
    calibration: Literal[
        "well_calibrated",
        "overconfident",
        "underconfident",
    ] = "well_calibrated"


class DiagnosticResult(BaseModel):
    concept: str = "General Topic"
    mastery_score: float = 0.5
    understood: List[str] = Field(default_factory=list)
    misconceptions: List[Misconception] = Field(default_factory=list)
    confidence_calibration: ConfidenceCalibration = Field(default_factory=ConfidenceCalibration)
    next_action: str = "Review concept and practice problem"
    instructions: List[str] = Field(default_factory=list)