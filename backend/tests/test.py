from app.core.security import hash_password, verify_password

password = "MyStrongPassword123!"

hashed = hash_password(password)

print("Hash:", hashed)
print("Correct:", verify_password(password, hashed))
print("Wrong:", verify_password("WrongPassword", hashed))