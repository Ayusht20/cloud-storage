from pathlib import Path

from app.services.storage_service import upload_file


test_file = Path("cloudinary_test.txt")


with test_file.open("rb") as file:
    result = upload_file(
        file=file,
        filename=test_file.name,
        content_type="text/plain",
    )


print("Upload successful")
print("Public ID:", result["public_id"])
print("Resource type:", result["resource_type"])
print("Secure URL:", result["secure_url"])