"""'processing' pipeline: species climate-risk general layer + MPA zonal stats.

Reproduces ``notebooks/first_iteration_layers.py``.
"""

from kedro.pipeline import Pipeline, node, pipeline

from .nodes import (
    aggregate_species_risk,
    compute_mpa_zonal_stats,
    write_general_layer_rasters,
)


def create_pipeline(**kwargs) -> Pipeline:
    return pipeline(
        [
            node(
                func=aggregate_species_risk,
                inputs=[
                    "species_risk_raw",
                    "params:species_risk_dim_cols",
                    "params:species_risk_var_numeric_cols",
                ],
                outputs="species_risk_general_layer",
                name="aggregate_species_risk",
            ),
            node(
                func=write_general_layer_rasters,
                inputs=[
                    "species_risk_general_layer",
                    "params:species_risk_var_numeric_cols",
                ],
                outputs="general_layer_rasters",
                name="write_general_layer_rasters",
            ),
            node(
                func=compute_mpa_zonal_stats,
                inputs=["marine_conservation_areas", "general_layer_rasters"],
                outputs="mpas_climate_risk_stats",
                name="compute_mpa_zonal_stats",
            ),
        ]
    )
