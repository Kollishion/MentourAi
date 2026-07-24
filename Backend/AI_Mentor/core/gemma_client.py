import os
import re
from ollama import Client

MODEL_NAME = os.getenv("LLM_MODEL", "gemma4:31b-cloud")
client = Client()


def call_gemma(prompt: str, schema: dict) -> str:
    """Send a prompt to Gemma, constrained to the given pydantic schema, and return raw JSON text."""
    try:
        response = client.chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            format=schema,
        )
    except Exception:
        response = client.chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            format="json",
        )
        
    content = response["message"]["content"]
    
    # Strip markdown fences if present
    content = re.sub(r"^```json\s*", "", content.strip(), flags=re.IGNORECASE)
    content = re.sub(r"^```\s*", "", content.strip())
    content = re.sub(r"\s*```$", "", content.strip())
    return content

