from types import SimpleNamespace

from app.core.security import hash_password, verify_password
from app.models import AdminUser
from app.services import admin_bootstrap


class ExistingAdminSession:
    def __init__(self, admin: AdminUser):
        self.admin = admin

    def scalar(self, _statement):
        return self.admin

    def add(self, _record):
        raise AssertionError("existing administrators must not be recreated")


def test_seed_does_not_overwrite_existing_admin_password(monkeypatch) -> None:
    existing_hash = hash_password("operator-chosen-password")
    admin = AdminUser(
        username="admin",
        password_hash=existing_hash,
        role="super_admin",
        is_active=True,
    )
    monkeypatch.setattr(
        admin_bootstrap,
        "get_settings",
        lambda: SimpleNamespace(
            admin_default_username="admin",
            admin_default_password="deployment-default-password",
        ),
    )

    admin_bootstrap.ensure_admin_user(ExistingAdminSession(admin))

    assert admin.password_hash == existing_hash
    assert verify_password("operator-chosen-password", admin.password_hash)
    assert not verify_password("deployment-default-password", admin.password_hash)
