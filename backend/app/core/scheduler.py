"""
Planification de la veille quotidienne via APScheduler.
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.core.database import SessionLocal
from app.core.config import settings
from app.services.acquisition import sync_orchestrator

logger = logging.getLogger(__name__)


def run_daily_sync():
    db = SessionLocal()
    try:
        result = sync_orchestrator.run(db)
        logger.info(f"Veille quotidienne terminée : {result}")
    except Exception:
        logger.exception("Échec de la veille quotidienne planifiée")
    finally:
        db.close()


def start_scheduler():
    if not settings.scheduler_enabled:
        return None
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        run_daily_sync,
        trigger="cron",
        hour=settings.scheduler_hour,
        minute=settings.scheduler_minute,
        id="veille_quotidienne_appels_offres",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(f"Scheduler démarré : veille quotidienne à {settings.scheduler_hour}h{settings.scheduler_minute:02d}")
    return scheduler