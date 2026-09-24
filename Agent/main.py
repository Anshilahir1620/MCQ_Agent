from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from api.routes import router
from index import cleanup_expired_namespaces

app = FastAPI(title="MCQ Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mcq-agent.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

scheduler = AsyncIOScheduler()


@app.on_event("startup")
async def on_startup():
    cleanup_expired_namespaces()
    scheduler.add_job(cleanup_expired_namespaces, "interval", hours=1)
    scheduler.start()


@app.get("/health")
def health():
    return {"status": "ok"}
