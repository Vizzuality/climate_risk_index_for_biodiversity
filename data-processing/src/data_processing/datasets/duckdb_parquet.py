"""A duckdb-backed dataset for large, sharded parquet datasets."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import duckdb
from kedro.io.core import AbstractDataset, DatasetError


class DuckDBParquetGlobDataset(AbstractDataset[None, duckdb.DuckDBPyRelation]):
    """Exposes a glob of parquet files as a lazy `duckdb.DuckDBPyRelation`.

    Meant for datasets too large to load eagerly as a single DataFrame: a
    node receives the relation and can push SQL (aggregations, filters...)
    down into duckdb instead of materialising the whole thing in memory.

    Read-only, and local-filesystem only for now (the source data isn't
    wired to remote storage yet).
    """

    def __init__(self, *, filepath: str) -> None:
        self._filepath = filepath

    def load(self) -> duckdb.DuckDBPyRelation:
        return duckdb.read_parquet(self._filepath)

    def save(self, data: None) -> None:
        raise DatasetError(f"'{self.__class__.__name__}' is a read-only dataset")

    def _describe(self) -> dict[str, Any]:
        return {"filepath": self._filepath}

    def _exists(self) -> bool:
        # `_filepath` is a glob pattern (e.g. "*.parquet"); Path.parent is
        # the first non-glob segment, so this checks the dataset directory
        # exists and holds at least one matching file.
        pattern = Path(self._filepath)
        return any(pattern.parent.glob(pattern.name))
