from enum import Enum

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.file import File
from app.models.share import Share
from app.models.user import User


class Permission(str, Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"
    NONE = "none"


def get_file_permission(
    file: File,
    current_user: User,
    db: Session,
) -> Permission:
    """
    Return the current user's permission for a file.

    Owner:
        Full access.

    Editor:
        Read and modify access.

    Viewer:
        Read-only access.

    None:
        No access.
    """

    if file.owner_id == current_user.id:
        return Permission.OWNER

    share = db.scalar(
        select(Share).where(
            Share.file_id == file.id,
            Share.shared_with_user_id == current_user.id,
        )
    )

    if not share:
        return Permission.NONE

    if share.role == Permission.EDITOR.value:
        return Permission.EDITOR

    if share.role == Permission.VIEWER.value:
        return Permission.VIEWER

    return Permission.NONE


def can_view(
    file: File,
    current_user: User,
    db: Session,
) -> bool:
    permission = get_file_permission(
        file,
        current_user,
        db,
    )

    return permission in {
        Permission.OWNER,
        Permission.EDITOR,
        Permission.VIEWER,
    }


def can_edit(
    file: File,
    current_user: User,
    db: Session,
) -> bool:
    permission = get_file_permission(
        file,
        current_user,
        db,
    )

    return permission in {
        Permission.OWNER,
        Permission.EDITOR,
    }


def can_delete(
    file: File,
    current_user: User,
    db: Session,
) -> bool:
    permission = get_file_permission(
        file,
        current_user,
        db,
    )

    return permission in {
        Permission.OWNER,
        Permission.EDITOR,
    }


def can_share(
    file: File,
    current_user: User,
    db: Session,
) -> bool:
    permission = get_file_permission(
        file,
        current_user,
        db,
    )

    # Only the owner can currently manage sharing.
    return permission == Permission.OWNER