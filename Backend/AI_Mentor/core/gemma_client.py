import os
import re
from typing import Optional
from ollama import Client

MODEL_NAME = os.getenv("CLOUD_MODEL", os.getenv("OLLAMA_MODEL", "gemma4:31b-cloud"))

client = Client(
    #host=os.getenv("OLLAMA_HOST", "http://localhost:11434"),
)


def call_gemma(prompt: str, schema: Optional[dict] = None) -> str:
    """
    Send a prompt to Gemma.
    If a schema is provided, request structured JSON.
    Otherwise, return normal conversational text.
    """
    try:
        if schema is not None:
            response = client.chat(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                format=schema,
            )
        else:
            response = client.chat(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
            )
    except Exception:
        if schema is not None:
            response = client.chat(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                format="json",
            )
        else:
            raise

    content = response["message"]["content"]
    content = re.sub(r"^```json\s*", "", content.strip(), flags=re.IGNORECASE)
    content = re.sub(r"^```\s*", "", content.strip())
    content = re.sub(r"\s*```$", "", content.strip())
    return content
