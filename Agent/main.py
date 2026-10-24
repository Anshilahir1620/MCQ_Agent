
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from api.routes import router
from index import cleanup_expired_namespaces
from assistant import app as portfolio_app


scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    cleanup_expired_namespaces()

    scheduler.add_job(
        cleanup_expired_namespaces,
        trigger="interval",
        hours=1,
        id="cleanup_expired_namespaces",
        replace_existing=True,
    )
    scheduler.start()

    try:
        yield
    finally:
        if scheduler.running:
            scheduler.shutdown(wait=False)


app = FastAPI(
    title="MCQ Generator API",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = [
    "https://mcq-agent.vercel.app",
    "https://frontend-ten-umber-75.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://anshilahir.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

app.mount("/portfolio", portfolio_app)


@app.get("/")
def home():
    return {"message": "MCQ Generator API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
