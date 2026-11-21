from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Cinema, CinemaBundle
from app.schema.cinema_schema import (
    BookingOut,
    BundleCount,
    CinemaCreate,
    CinemaOut,
)
from app.service.booking import min_bundles


def to_out(cinema: Cinema) -> CinemaOut:
    return CinemaOut(
        id=cinema.id,
        name=cinema.name,
        bundle_sizes=[b.size for b in cinema.bundles],
    )


async def create_cinema(data: CinemaCreate, db: AsyncSession) -> CinemaOut:
    cinema = Cinema(
        name=data.name,
        bundles=[CinemaBundle(size=s) for s in data.bundle_sizes],
    )
    db.add(cinema)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail={
                "code": "DUPLICATE_NAME",
                "message": "A cinema with this name already exists",
            },
        )

    return to_out(cinema)


async def list_cinemas(db: AsyncSession) -> list[CinemaOut]:
    result = await db.scalars(
        select(Cinema).options(selectinload(Cinema.bundles)).order_by(Cinema.id)
    )
    return [to_out(c) for c in result]


async def get_booking(cinema_id: int, group_size: int, db: AsyncSession) -> BookingOut:
    cinema = await db.scalar(
        select(Cinema)
        .where(Cinema.id == cinema_id)
        .options(selectinload(Cinema.bundles))
    )
    if cinema is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "CINEMA_NOT_FOUND", "message": "Cinema not found"},
        )

    counts = min_bundles([b.size for b in cinema.bundles], group_size)

    if counts is None:
        return BookingOut(
            cinema=cinema.name,
            group_size=group_size,
            possible=False,
            total_bundles=None,
            bundles=[],
        )

    return BookingOut(
        cinema=cinema.name,
        group_size=group_size,
        possible=True,
        total_bundles=sum(counts.values()),
        bundles=[
            BundleCount(size=s, count=c)
            for s, c in sorted(counts.items(), reverse=True)
        ],
    )