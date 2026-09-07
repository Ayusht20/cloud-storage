import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, BigInteger, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


# ============================================================
# STORAGE LIMITS
# ============================================================

DEFAULT_STORAGE_LIMIT = 2_500_000_000  # 2.5 GB


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # ========================================================
    # STORAGE
    # ========================================================

    storage_limit: Mapped[int] = mapped_column(
        BigInteger,
        default=DEFAULT_STORAGE_LIMIT,
        nullable=False,
    )

    storage_used: Mapped[int] = mapped_column(
        BigInteger,
        default=0,
        nullable=False,
    )

    # ========================================================
    # TIMESTAMPS
    # ========================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )