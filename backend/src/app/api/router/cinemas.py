from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schema.cinema_schema import BookingOut, CinemaCreate, CinemaOut
from app.service.cinemas import create_cinema, get_booking, list_cinemas

router = APIRouter(tags=["cinemas"])


@router.post("/cinemas", response_model=CinemaOut, status_code=201)
@router.post("/api/cinemas", response_model=CinemaOut, status_code=201)
async def create_cinemas(cinema: CinemaCreate, db: AsyncSession = Depends(get_db)):
    return await create_cinema(cinema, db)


@router.get("/cinemas", response_model=list[CinemaOut])
@router.get("/api/cinemas", response_model=list[CinemaOut])
async def get_cinemas(db: AsyncSession = Depends(get_db)):
    return await list_cinemas(db)


@router.get("/cinemas/{cinema_id}/booking", response_model=BookingOut)
@router.get("/api/cinemas/{cinema_id}/booking", response_model=BookingOut)
async def booking_quote(
    cinema_id: int,
    group_size: int = Query(..., alias="groupSize", ge=1, le=10000),
    db: AsyncSession = Depends(get_db),
):
    return await get_booking(cinema_id, group_size, db)