from typing import BinaryIO

import cloudinary
import cloudinary.uploader

from app.core.config import settings


cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def get_resource_type(content_type: str | None) -> str:
    """
    Determine the Cloudinary resource type from the file MIME type.

    Cloudinary uses:
    - image for images
    - video for videos and audio
    - raw for documents and other files
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


def upload_file(
    file: BinaryIO,
    filename: str,
    content_type: str | None = None,
    folder: str = "cloud-storage-service",
) -> dict:
    """
    Upload a file to Cloudinary and return its metadata.
    """

    resource_type = get_resource_type(content_type)

    result = cloudinary.uploader.upload(
        file,
        resource_type=resource_type,
        folder=folder,
        use_filename=True,
        unique_filename=True,
        overwrite=False,
    )

    return result