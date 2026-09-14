from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.models import AdminUser


def ensure_admin_user(db: Session) -> None:
    settings = get_settings()
    admin = db.scalar(select(AdminUser).where(AdminUser.username == settings.admin_default_username))
    if admin is not None:
        return

    db.add(
        AdminUser(
            username=settings.admin_default_username,
            password_hash=hash_password(settings.admin_default_password),
            role="super_admin",
        )
    )
