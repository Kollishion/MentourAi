from pydantic import BaseModel
from typing import Dict, List


class StudentState(BaseModel):
    student_id: str
    concept_mastery: Dict[str, float] = {}
    prerequisites: Dict[str, List[str]] = {}
    misconception_log: Dict[str, List[str]] = {}

    def mastery_of(self, concept: str) -> float:
        return self.concept_mastery.get(concept, 0.0)
