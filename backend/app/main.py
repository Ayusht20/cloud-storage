from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.folders import router as folders_router
from app.routes.files import router as files_router
from app.routes.shares import router as shares_router
app = FastAPI(
    title="Cloud Storage Service",
    
)


origins = [
    "http://localhost:5173",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(folders_router)
app.include_router(files_router)
app.include_router(shares_router)

@app.get("/")
def root():
    return {
        "message": "Cloud Storage Service API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }