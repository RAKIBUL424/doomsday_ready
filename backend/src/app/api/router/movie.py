from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import Movie


router = APIRouter(
    prefix="/movies",
    tags=["movies"],
)


@router.post("/movies")
async def create_movie():
    pass