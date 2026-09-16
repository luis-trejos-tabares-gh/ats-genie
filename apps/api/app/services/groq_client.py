import json
import re

from groq import Groq

from app.config import settings

DEFAULT_MODEL = "openai/gpt-oss-120b"
MAX_COMPLETION_TOKENS = 4096


class GroqError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def groq_configured() -> bool:
    return bool(settings.groq_api_key.strip())


def get_model() -> str:
    return settings.groq_model or DEFAULT_MODEL


def get_client() -> Groq:
    if not groq_configured():
        raise GroqError("The AI service is not configured.", status_code=503)
    return Groq(api_key=settings.groq_api_key, timeout=settings.groq_timeout_seconds)


def _strip_fences(raw: str) -> str:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def complete_json(system_prompt: str, user_prompt: str) -> dict:
    try:
        response = get_client().chat.completions.create(
            model=get_model(),
            temperature=0.2,
            max_tokens=MAX_COMPLETION_TOKENS,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )
    except GroqError:
        raise
    except Exception as exc:
        raise GroqError("The AI service could not complete this request.") from exc

    content = response.choices[0].message.content if response.choices else None
    if not content:
        raise GroqError("The AI service returned an empty response.")
    try:
        parsed = json.loads(_strip_fences(content))
    except json.JSONDecodeError as exc:
        raise GroqError("The AI service returned invalid JSON.") from exc
    if not isinstance(parsed, dict):
        raise GroqError("The AI service returned an unexpected payload.")
    return parsed
