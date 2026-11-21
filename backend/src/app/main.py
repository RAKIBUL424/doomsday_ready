from fastapi import FastAPI
from app.api.router.movie_api import router as movie_router
from app.api.router.cinemas import router as cinema_router



app = FastAPI(title="Doomsday Ready")
app.include_router(movie_router)
app.include_router(cinema_router)
app.include_router(cinema_router, prefix="/api")



@app.get("/health")
async def health():
    return {"status": "ok"}