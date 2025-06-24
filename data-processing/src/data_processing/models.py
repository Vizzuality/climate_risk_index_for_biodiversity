from typing import Annotated, Literal

from pydantic import BaseModel, Field, RootModel
from pydantic.config import ConfigDict


class StatsValue(BaseModel):
    model_config = ConfigDict(ser_json_inf_nan="null")

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
    model_config = ConfigDict(ser_json_inf_nan="null")

    name_en: str
    admin_region: str
    area_ha: float
    type: str
    website_url: str | None
    bbox: tuple[float, float, float, float]
    indicator: list[
        Annotated[Indicator | CategoricalIndicator, Field(discriminator="type")]
    ]


class MarineProtectedAreasIndex(RootModel):
    root: list[MarineProtectedAreasEntity]
