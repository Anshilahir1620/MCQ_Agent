from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from api.routes import router
from index import cleanup_expired_namespaces

app = FastAPI(title="MCQ Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",              # local frontend dev
        "https://your-frontend-domain.com",     # update once deployed
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(router)

scheduler = AsyncIOScheduler()


@app.on_event("startup")
async def on_startup():
    cleanup_expired_namespaces()   # runs once immediately — covers "server restarted, clean up first"
    scheduler.add_job(cleanup_expired_namespaces, "interval", hours=1)
    scheduler.start()


@app.get("/health")
def health():
    return {"status": "ok"}