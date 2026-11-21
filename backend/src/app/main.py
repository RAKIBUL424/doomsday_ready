from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router.movie_api import router as movie_router
from app.api.router.cinemas import router as cinema_router

app = FastAPI(title="Doomsday Ready")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(movie_router)
app.include_router(cinema_router)

@app.get("/health")
async def health():
    return {"status": "ok"}