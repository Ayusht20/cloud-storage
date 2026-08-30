from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.folders import router as folders_router
from app.routes.files import router as files_router
from app.routes.shares import router as shares_router
from app.routes.public_links import router as public_links_router
from app.routes.search import router as search_router
from app.routes.trash import router as trash_router
from app.routes.health import router as health_router


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

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
        },
    )

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(folders_router)
app.include_router(files_router)
app.include_router(shares_router)
app.include_router(public_links_router)
app.include_router(search_router)
app.include_router(trash_router)
app.include_router(health_router)

@app.get("/")
def root():
    return {
        "message": "Cloud Storage Service API is running"
    }