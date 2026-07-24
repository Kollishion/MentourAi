from typing import List


def chunk_text(text: str, max_chars: int = 6000, overlap_chars: int = 400) -> List[str]:
    """
    Split long text into overlapping chunks that fit comfortably in
    a single model call, splitting on paragraph boundaries where
    possible so a concept isn't sliced apart mid-sentence.

    A small overlap is carried into the next chunk so a concept
    explained right at a chunk boundary doesn't get lost.
    """
    text = text.strip()
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]

    paragraphs = text.split("\n\n")
    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        if len(para) > max_chars:
            # a single paragraph is bigger than the chunk size - hard split it
            if current:
                chunks.append(current)
                current = ""
            step = max_chars - overlap_chars
            for i in range(0, len(para), step):
                chunks.append(para[i:i + max_chars])
            continue

        candidate = f"{current}\n\n{para}" if current else para
        if len(candidate) <= max_chars:
            current = candidate
        else:
            chunks.append(current)
            tail = current[-overlap_chars:] if overlap_chars else ""
            current = f"{tail}\n\n{para}" if tail else para

    if current:
        chunks.append(current)

    return chunks
