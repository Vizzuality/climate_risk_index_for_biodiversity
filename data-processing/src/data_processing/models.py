from typing import Annotated, Literal

from pydantic import BaseModel, Field, RootModel

type BoundingBox = tuple[float, float, float, float]


class StatsValue(BaseModel):
    min: float | None
    max: float | None
    mean: float | None


class CategoricalStatsValue(BaseModel):
    mode: int


class CategoricalScenario(BaseModel):
    high: CategoricalStatsValue
    low: CategoricalStatsValue


class Scenario(BaseModel):
    high: StatsValue
    low: StatsValue


class Indicator(BaseModel):
    name: str
    scenario: Scenario
    type: Literal["numerical"]


class CategoricalIndicator(BaseModel):
    name: str
    scenario: CategoricalScenario
    type: Literal["categorical"]


class MarineProtectedAreasEntity(BaseModel):
    name_en: str
    # TODO: ADMIN REGION
    # admin_region: str
    area_ha: float
    type: str
    website_url: str | None
    bbox: BoundingBox
    indicator: list[
        Annotated[Indicator | CategoricalIndicator, Field(discriminator="type")]
    ]


class MarineProtectedAreasIndex(RootModel):
    root: list[MarineProtectedAreasEntity]
