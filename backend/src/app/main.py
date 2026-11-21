from fastapi import FastAPI
from app.api.router.movie_api import router as movie_router



app = FastAPI(title="Doomsday Ready")
app.include_router(movie_router)



@app.get("/health")
async def health():
    return {"status": "ok"}