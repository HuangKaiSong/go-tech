from dataclasses import dataclass


@dataclass(slots=True)
class Document:
    text: str
    metadata: dict[str, object]
