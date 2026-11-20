from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    ForeignKey,
    Integer,
    String,
    Table,
    UniqueConstraint,
    false,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# Movie <-> Movie (prerequisite) er jonno join table
movie_prerequisites = Table(
    "movie_prerequisites",
    Base.metadata,
    Column(
        "movie_id",
        ForeignKey("movies.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "prerequisite_id",
        ForeignKey("movies.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    CheckConstraint("movie_id != prerequisite_id", name="ck_no_self_prerequisite"),
)


class Movie(Base):
    __tablename__ = "movies"
    __table_args__ = (
        CheckConstraint("runtime >= 1 AND runtime <= 300", name="ck_movie_runtime"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    release_year: Mapped[int] = mapped_column(Integer, nullable=False)
    runtime: Mapped[int] = mapped_column(Integer, nullable=False)  # minutes
    watched: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )

    # ei movie dekhar age ja ja dekha lagbe
    prerequisites: Mapped[list["Movie"]] = relationship(
        "Movie",
        secondary=movie_prerequisites,
        primaryjoin=lambda: Movie.id == movie_prerequisites.c.movie_id,
        secondaryjoin=lambda: Movie.id == movie_prerequisites.c.prerequisite_id,
        backref="dependents",
    )


class Cinema(Base):
    __tablename__ = "cinemas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    bundles: Mapped[list["CinemaBundle"]] = relationship(
        back_populates="cinema",
        cascade="all, delete-orphan",
        order_by="CinemaBundle.size",
    )


class CinemaBundle(Base):
    __tablename__ = "cinema_bundles"
    __table_args__ = (
        UniqueConstraint("cinema_id", "size", name="uq_cinema_bundle_size"),
        CheckConstraint("size >= 1 AND size <= 500", name="ck_bundle_size"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cinema_id: Mapped[int] = mapped_column(
        ForeignKey("cinemas.id", ondelete="CASCADE"), nullable=False
    )
    size: Mapped[int] = mapped_column(Integer, nullable=False)

    cinema: Mapped["Cinema"] = relationship(back_populates="bundles")