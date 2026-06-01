import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from database import get_overdue_offers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_overdue_offers() -> list[dict]:
    """Prüft alle offenen Angebote und gibt überfällige zurück."""
    overdue = get_overdue_offers()
    if overdue:
        logger.info(
            "[%s] %d überfällige Angebot(e) gefunden.",
            datetime.now().strftime("%Y-%m-%d %H:%M"),
            len(overdue),
        )
        for row in overdue:
            created = datetime.fromisoformat(row["created_at"])
            days_open = (datetime.now() - created).days
            logger.info(
                "  → %s | %s€ | seit %d Tagen offen",
                row["client_name"],
                row["amount"],
                days_open,
            )
    else:
        logger.info("[%s] Keine überfälligen Angebote.", datetime.now().strftime("%Y-%m-%d %H:%M"))

    return [dict(row) for row in overdue]


def start_scheduler() -> BackgroundScheduler:
    """Startet den APScheduler-Hintergrundjob täglich um 09:00."""
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        check_overdue_offers,
        trigger=CronTrigger(hour=9, minute=0),
        id="overdue_check",
        name="Überfällige Angebote prüfen",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler gestartet – tägliche Prüfung um 09:00 Uhr.")
    return scheduler


if __name__ == "__main__":
    # Manueller Test
    results = check_overdue_offers()
    print(f"\nÜberfällige Angebote: {len(results)}")
    for r in results:
        print(r)
