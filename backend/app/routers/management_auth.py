from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, get_current_admin_user, verify_password
from app.models import AdminUser
from app.schemas.management import AdminLoginIn, AdminLoginOut, AdminUserOut

router = APIRouter(prefix="/management/auth", tags=["management-auth"])


@router.post("/login", response_model=AdminLoginOut)
def login(payload: AdminLoginIn, db: Session = Depends(get_db)) -> AdminLoginOut:
    admin = db.scalar(
        select(AdminUser).where(
            AdminUser.username == payload.username.strip(),
            AdminUser.is_active.is_(True),
        )
    )
    if admin is None or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    return AdminLoginOut(
        access_token=create_access_token(admin.username),
        user=admin,
    )


@router.get("/me", response_model=AdminUserOut)
def get_me(current_user: AdminUser = Depends(get_current_admin_user)) -> AdminUser:
    return current_user
