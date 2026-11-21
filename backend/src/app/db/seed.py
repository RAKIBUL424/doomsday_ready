import asyncio
import csv
import os
from pathlib import Path

from sqlalchemy import insert, select

from app.db.database import AsyncSessionLocal, engine
from app.db.models import Movie, movie_prerequisites

DATA_FILE = Path(__file__).resolve().parents[3] / "data" / "movies.csv"


def split(value: str) -> list[str]:
    return [p.strip() for p in value.split("|") if p.strip()]


async def seed_movies(db) -> int:
    with open(DATA_FILE, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    existing = set(await db.scalars(select(Movie.title)))

    created: set[str] = set()
    for r in rows:
        if r["title"] in existing:
            continue
        db.add(
            Movie(
                title=r["title"],
                release_year=int(r["release_year"]),
                runtime=int(r["runtime"]),
                watched=r["watched"].strip().lower() == "true",
            )
        )
        created.add(r["title"])

    await db.flush()

    ids = {t: i for t, i in (await db.execute(select(Movie.title, Movie.id))).all()}

    links = []
    for r in rows:
        if r["title"] not in created:
            continue
        for p in split(r["prerequisites"]):
            if p not in ids:
                raise ValueError(f"Prerequisite not found in CSV: {p}")
            links.append({"movie_id": ids[r["title"]], "prerequisite_id": ids[p]})

    if links:
        await db.execute(insert(movie_prerequisites), links)

    return len(created)


async def main() -> None:
    if os.getenv("SEED_DATA", "true").lower() != "true":
        print("Seeding skipped (SEED_DATA is not true)")
        return

    async with AsyncSessionLocal() as db:
        added = await seed_movies(db)
        await db.commit()

    print(f"Seed done: {added} movies added")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())