import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database.connection import init_db
from app.api.candidates import router as candidates_router
from app.api.interviews import router as interviews_router

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("PrepzoAPI")

# Ensure uploads directory exists
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(os.path.join(settings.upload_dir, "audio"), exist_ok=True)

app = FastAPI(
    title="Prepzo - AI Interview & Communication Coach",
    description="Multi-agent interview practice platform powered by LangGraph, FastAPI, and React.",
    version="1.0.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(candidates_router)
app.include_router(interviews_router)

# Mount uploads static files
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.on_event("startup")
def on_startup():
    logger.info("Initializing database tables...")
    init_db()
    logger.info(f"App started successfully in {settings.app_env} environment.")


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "env": settings.app_env,
        "llm_provider": settings.llm_provider,
        "whisper_provider": settings.whisper_provider,
        "database": "sqlite" if settings.database_url.startswith("sqlite") else "postgresql",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.api_host, port=settings.api_port, reload=settings.debug)
