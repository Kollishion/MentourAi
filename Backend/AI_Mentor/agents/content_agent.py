import json
from difflib import SequenceMatcher
from typing import List, Optional

from prompts.content_prompt import CONTENT_PROMPT
from schemas.content import ContentMap, ConceptNode, Subtopic, MaterialInput
from core.gemma_client import call_gemma
from core.chunking import chunk_text

# How similar two concept names need to be (0-1) to be treated as the
# same concept when merging across chunks/sources
NAME_MATCH_THRESHOLD = 0.85


def _extract_from_text(text: str, material_type: str, source_name: str) -> ContentMap:
    prompt = (
        CONTENT_PROMPT
        .replace("{material_type}", str(material_type))
        .replace("{source_name}", str(source_name))
        .replace("{material_excerpt}", str(text))
    )
    content = call_gemma(prompt, schema=ContentMap.model_json_schema())

    try:
        data = json.loads(content)
        if isinstance(data, dict):
            if "subject" not in data or not data["subject"]:
                data["subject"] = "Course Material"
            if "concepts" not in data:
                data["concepts"] = []
            return ContentMap.model_validate(data)
    except Exception:
        pass

    try:
        return ContentMap.model_validate_json(content)
    except Exception:
        return ContentMap(subject="Course Material", concepts=[])



def _names_match(a: str, b: str) -> bool:
    a, b = a.strip().lower(), b.strip().lower()
    if a == b:
        return True
    return SequenceMatcher(None, a, b).ratio() >= NAME_MATCH_THRESHOLD


def _merge_subtopics(existing: List[Subtopic], new: List[Subtopic]) -> List[Subtopic]:
    merged = list(existing)
    for st in new:
        if not any(_names_match(st.name, e.name) for e in merged):
            merged.append(st)
    return merged


def _merge_concept(existing: ConceptNode, new: ConceptNode) -> ConceptNode:
    existing.subtopics = _merge_subtopics(existing.subtopics, new.subtopics)

    for prereq in new.prerequisites:
        if not any(_names_match(prereq, p) for p in existing.prerequisites):
            existing.prerequisites.append(prereq)

    if new.importance is not None:
        existing.importance = max(existing.importance or 0.0, new.importance)

    if new.exam_frequency:
        existing.exam_frequency = (existing.exam_frequency or 0) + new.exam_frequency

    return existing


def merge_content_maps(maps: List[ContentMap]) -> ContentMap:
    """
    Merge concept maps extracted from multiple chunks/materials into
    one. Concepts are matched by fuzzy name instead of exact string
    match, so the same concept mentioned differently across a
    syllabus, lecture notes, and a past exam paper collapses into a
    single node with unioned subtopics/prerequisites and summed
    exam_frequency.
    """
    if not maps:
        return ContentMap(subject="Unknown", concepts=[])

    subject = next((m.subject for m in maps if m.subject), maps[0].subject)
    merged_concepts: List[ConceptNode] = []

    for cmap in maps:
        for concept in cmap.concepts:
            match = next(
                (c for c in merged_concepts if _names_match(c.name, concept.name)),
                None,
            )
            if match:
                _merge_concept(match, concept)
            else:
                merged_concepts.append(concept.model_copy(deep=True))

    return ContentMap(subject=subject, concepts=merged_concepts)


def content_agent(materials: List[MaterialInput]) -> ContentMap:
    """
    Turns one or more pieces of uploaded material (lecture notes,
    syllabus, transcript, past exam paper, ...) into a single
    structured concept map:

      1. Long material is chunked so it fits the model's context.
      2. Each chunk is extracted independently.
      3. Every chunk's result, across every material, is merged into
         one ContentMap - subtopics deduped, prerequisites unioned,
         exam_frequency summed across every past exam paper given.

    This is what feeds orchestrator.load_content_map() (the
    prerequisite gate) and the student-facing learning-map view.
    """
    all_maps: List[ContentMap] = []

    for material in materials:
        chunks = chunk_text(material.text)
        for chunk in chunks:
            cmap = _extract_from_text(chunk, material.material_type, material.source_name)
            all_maps.append(cmap)

    return merge_content_maps(all_maps)