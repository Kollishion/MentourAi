CONTENT_PROMPT = """
You are a curriculum-structuring AI.
Read the study material below ({material_type} from {source_name}) and extract a knowledge map.

Study material ({material_type} - {source_name}):
{material_excerpt}

You MUST return ONLY a raw JSON object with these EXACT keys:
{{
  "subject": "Subject Name",
  "concepts": [
    {{
      "name": "Concept Name",
      "subtopics": [
        {{
          "name": "Subtopic Name",
          "description": "Subtopic Description"
        }}
      ],
      "prerequisites": ["Prerequisite Concept Name"],
      "importance": 0.8,
      "exam_frequency": 1
    }}
  ]
}}

Rules:
- Do not teach or explain anything - only structure what is present.
- Do NOT use markdown code fences.
- Return ONLY valid raw JSON matching the keys above.
"""



