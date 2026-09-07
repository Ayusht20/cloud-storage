from typing import BinaryIO

import cloudinary
import cloudinary.uploader
import cloudinary.utils

from fastapi import HTTPException, status

from app.core.config import settings


# ============================================================
# CLOUDINARY CONFIGURATION
# ============================================================

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


# ============================================================
# MAXIMUM FILE SIZE
# ============================================================

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


# ============================================================
# RESOURCE TYPE
# ============================================================

def get_resource_type(
    content_type: str | None,
) -> str:
    """
    Determine the Cloudinary resource type
    from the MIME type.
    """

    if not content_type:
        return "raw"

    if content_type.startswith("image/"):
        return "image"

    if (
        content_type.startswith("video/")
        or content_type.startswith("audio/")
    ):
        return "video"

    return "raw"


# ============================================================
# UPLOAD FILE
# ============================================================

def upload_file(
    file: BinaryIO,
    filename: str,
    content_type: str | None = None,
    folder: str = "cloud-storage-service",
) -> dict:
    """
    Upload a file to Cloudinary.

    Supports both file-like objects and raw bytes.
    """

    resource_type = get_resource_type(content_type)

    try:
        # --------------------------------------------------
        # Convert raw bytes into a file-like object
        # --------------------------------------------------

        if isinstance(file, bytes):
            from io import BytesIO

            file = BytesIO(file)

        # --------------------------------------------------
        # Upload to Cloudinary
        # --------------------------------------------------

        return cloudinary.uploader.upload(
            file,
            resource_type=resource_type,
            folder=folder,
            use_filename=True,
            unique_filename=True,
            overwrite=False,
        )

    except Exception:
        raise


# ============================================================
# GET FILE URL
# ============================================================

def get_file_url(
    public_id: str,
    resource_type: str,
) -> str:
    """
    Generate a Cloudinary delivery URL
    for an uploaded file.
    """

    return cloudinary.utils.cloudinary_url(
        public_id,
        resource_type=resource_type,
        secure=True,
    )[0]


# ============================================================
# GET DOWNLOAD URL
# ============================================================

def get_download_url(
    public_id: str,
    resource_type: str,
) -> str:
    """
    Generate the Cloudinary delivery URL
    for a stored asset.
    """

    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        resource_type=resource_type,
        secure=True,
    )

    return url