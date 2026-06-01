import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = (
    "Du bist ein professioneller Assistent für Freelancer. "
    "Schreibe eine kurze, freundliche Follow-up E-Mail auf Deutsch. "
    "Ton: professionell aber persönlich, nicht aufdringlich. "
    "Maximal 5 Sätze. Kein Betreff nötig."
)


def generate_followup(
    client_name: str,
    project_desc: str,
    amount: float,
    days_open: int,
) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY ist nicht gesetzt.")

    client = anthropic.Anthropic(api_key=api_key)

    user_prompt = (
        f"Schreibe eine Follow-up Mail für:\n"
        f"Kunde: {client_name}\n"
        f"Projekt: {project_desc}\n"
        f"Angebotsbetrag: {amount:.2f}€\n"
        f"Angebot ist seit {days_open} Tagen offen."
    )

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    return message.content[0].text
