from pydantic import BaseModel, ConfigDict, Field, field_validator



class CinemaCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)


    name: str = Field(..., min_length=1, max_length=255)
    bundle_sizes: list[int] = Field(..., min_length=1, max_length=10)


    @field_validator("bundle_sizes")
    @classmethod
    def check_sizes(cls, sizes: list[int]) -> list[int]:
        if any(s < 1 or s > 500 for s in sizes):
            raise ValueError("Each bundle size must be between 1 and 500.")
        if len(set(sizes)) != len(sizes):
            raise ValueError("Bundle sizes must be different from each other.")
        return sorted(sizes)




class CinemaOut(BaseModel):
    id: int
    name: str
    bundle_sizes: list[int]

    


class BundleCount(BaseModel):
    size: int
    count: int


class BookingOut(BaseModel):
    cinema: str
    group_size: int
    possible: bool
    total_bundles: int | None
    bundles: list[BundleCount]