from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class PublicLink(Base):
    __tablename__ = "public_links"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    token: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        nullable=False,
        index=True,
    )

    file_id: Mapped[str | None] = mapped_column(
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    folder_id: Mapped[str | None] = mapped_column(
        ForeignKey("folders.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    password_hash: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

    file = relationship(
        "File",
        back_populates="public_links",
    )

    folder = relationship(
        "Folder",
        back_populates="public_links",
    )