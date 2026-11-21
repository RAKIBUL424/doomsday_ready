from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from collections import defaultdict

from app.db.models import Movie, movie_prerequisites
from app.schema.movie_schema import MovieCreate, MovieUpdate, RewatchOrderOut
from app.service.graph import rewatch_order, would_create_cycle


async def create_movie(data: MovieCreate, db: AsyncSession) -> Movie:
    prerequisites: list[Movie] = []
    ids = set(data.prerequisite_ids)

    if ids:
        result = await db.scalars(select(Movie).where(Movie.id.in_(ids)))
        prerequisites = list(result)
        missing = ids - {m.id for m in prerequisites}
        if missing:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "PREREQUISITE_NOT_FOUND",
                    "message": f"Movie ids not found: {sorted(missing)}",
                },
            )

    movie = Movie(
        title=data.title,
        release_year=data.release_year,
        runtime=data.runtime,
        watched=data.watched,
        prerequisites=prerequisites,
    )
    db.add(movie)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail={
                "code": "DUPLICATE_TITLE",
                "message": "A movie with this title already exists",
            },
        )

    return movie



async def list_movies(db: AsyncSession) -> list[Movie]:
    result = await db.scalars(
        select(Movie).options(selectinload(Movie.prerequisites)).order_by(Movie.id)
    )
    return list(result)


async def update_movie(movie_id: int, data: MovieUpdate, db: AsyncSession) -> Movie:
    movie = await db.scalar(
        select(Movie)
        .where(Movie.id == movie_id)
        .options(selectinload(Movie.prerequisites))
    )
    if movie is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "MOVIE_NOT_FOUND", "message": "Movie not found"},
        )

    fields = data.model_dump(exclude_unset=True)

    if fields.get("prerequisites") is not None:
        titles = {t.strip() for t in fields["prerequisites"] if t.strip()}
        new_prereqs: list[Movie] = []

        if titles:
            result = await db.scalars(select(Movie).where(Movie.title.in_(titles)))
            new_prereqs = list(result)
            missing = titles - {m.title for m in new_prereqs}
            if missing:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "code": "PREREQUISITE_NOT_FOUND",
                        "message": f"Movies not found: {sorted(missing)}",
                    },
                )

            rows = await db.execute(
                select(movie_prerequisites.c.movie_id, movie_prerequisites.c.prerequisite_id)
            )
            graph: dict[int, list[int]] = defaultdict(list)
            for m_id, p_id in rows:
                graph[m_id].append(p_id)

            if would_create_cycle(movie.id, [m.id for m in new_prereqs], graph):
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "CIRCULAR_DEPENDENCY",
                        "message": "This change would create a circular dependency",
                    },
                )

        movie.prerequisites = new_prereqs

    for field in ("title", "release_year", "runtime", "watched"):
        if fields.get(field) is not None:
            setattr(movie, field, fields[field])

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail={
                "code": "DUPLICATE_TITLE",
                "message": "A movie with this title already exists",
            },
        )

    return movie


async def get_rewatch_order(movie_id: int, db: AsyncSession) -> RewatchOrderOut:
    target = await db.get(Movie, movie_id)
    if target is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "MOVIE_NOT_FOUND", "message": "Movie not found"},
        )

    rows = await db.execute(
        select(movie_prerequisites.c.movie_id, movie_prerequisites.c.prerequisite_id)
    )
    graph: dict[int, list[int]] = defaultdict(list)
    for m_id, p_id in rows:
        graph[m_id].append(p_id)

    ordered_ids = rewatch_order(movie_id, graph)

    movies: list[Movie] = []
    if ordered_ids:
        result = await db.scalars(select(Movie).where(Movie.id.in_(ordered_ids)))
        by_id = {m.id: m for m in result}
        movies = [by_id[i] for i in ordered_ids]

    return RewatchOrderOut(
        target=target.title,
        order=movies,
        total_count=len(movies),
        watched_count=sum(1 for m in movies if m.watched),
        unwatched_runtime=sum(m.runtime for m in movies if not m.watched),
    )