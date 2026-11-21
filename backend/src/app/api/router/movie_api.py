from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schema.movie_schema import MovieCreate, MovieOut, MovieUpdate, RewatchOrderOut
from app.service.movie_service import create_movie, get_rewatch_order, list_movies, update_movie


router = APIRouter(prefix="/api", tags=["movies"])


@router.post("/movies", response_model=MovieOut, status_code=201)
async def create_movies(movie: MovieCreate, db: AsyncSession = Depends(get_db)):
    return await create_movie(movie, db)

@router.get("/movies/list", response_model=list[MovieOut])
async def get_movies(db: AsyncSession = Depends(get_db)):
    return await list_movies(db)


@router.patch("/movies/{movie_id}", response_model=MovieOut)
async def patch_movie(
    movie_id: int, movie: MovieUpdate, db: AsyncSession = Depends(get_db)
):
    return await update_movie(movie_id, movie, db)


@router.get("/movies/{movie_id}/rewatch-order", response_model=RewatchOrderOut)
async def rewatch_order_route(movie_id: int, db: AsyncSession = Depends(get_db)):
    return await get_rewatch_order(movie_id, db)