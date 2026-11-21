from pydantic import BaseModel, Field, ConfigDict


class MovieCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)


    title: str = Field(..., min_length=2, max_length=200, description="Title of the movie")
    release_year: int = Field(..., description="Release year of the movie")
    runtime: int = Field(..., ge=1, le=300, description="Minutes")
    prerequisite_ids: list[int] = Field(default_factory=list)
    watched: bool = False

class PrerequisiteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str

class MovieOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    release_year: int
    runtime: int
    watched: bool
    prerequisites: list[PrerequisiteOut]



class MovieUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(default=None, min_length=1, max_length=255)
    release_year: int = Field(..., description="Release year of the movie")
    runtime: int = Field(default=None, ge=1, le=300)
    watched: bool = Field(default=None)
    prerequisites: list[str]


class RewatchMovieOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    release_year: int
    runtime: int
    watched: bool


class RewatchOrderOut(BaseModel):
    target: str
    order: list[RewatchMovieOut]
    total_count: int
    watched_count: int
    unwatched_runtime: int  # minutes

