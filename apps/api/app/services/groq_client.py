from groq import Groq

from app.config import settings

DEFAULT_MODEL = "openai/gpt-oss-120b"


def groq_configured() -> bool:
    return bool(settings.groq_api_key.strip())


def get_model() -> str:
    return settings.groq_model or DEFAULT_MODEL


def get_client() -> Groq | None:
    if not groq_configured():
        return None
    return Groq(api_key=settings.groq_api_key)


def complete_json(system_prompt: str, user_prompt: str) -> str | None:
    """Ready for analyze/assemble. Foundation endpoints do not call this yet."""
    client = get_client()
    if client is None:
        return None
    response = client.chat.completions.create(
        model=get_model(),
        temperature=0.2,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content
