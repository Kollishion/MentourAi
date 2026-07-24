from pydantic import BaseModel, Field
from typing import List, Optional


class TutorStep(BaseModel):
    title: str = "Step"
    explanation: str = "Explanation"


class TutorResponse(BaseModel):
    teaching_strategy: str = "guided_practice"
    misconceptions: str = "General misconception"
    explanation: str = "Review concept fundamentals"
    socratic_question: str = "What happens when you trace this step-by-step?"
    analogy: str = "Think of this like a real-world building block."
    thinking_time_seconds: Optional[int] = 10
    guided_steps: List[TutorStep] = Field(default_factory=list)
    practice_question: str = "Try solving a similar practice problem."
    encouragement: str = "Great effort, keep building your understanding!"