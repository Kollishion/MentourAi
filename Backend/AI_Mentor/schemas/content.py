from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class Subtopic(BaseModel):
    name: str = "General Subtopic"
    description: str = "General overview"


class ConceptNode(BaseModel):
    name: str = "Concept"
    subtopics: List[Subtopic] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)
    importance: Optional[float] = 0.5    # 0.0-1.0, how central this concept is
    exam_frequency: Optional[int] = 1  # times seen in past exam papers provided


class ContentMap(BaseModel):
    subject: str = "Course Material"
    concepts: List[ConceptNode] = Field(default_factory=list)


MaterialType = Literal[
    "lecture_notes",
    "syllabus",
    "textbook_chapter",
    "past_exam_paper",
    "video_transcript",
    "other",
]


class MaterialInput(BaseModel):
    source_name: str
    material_type: MaterialType
    text: str