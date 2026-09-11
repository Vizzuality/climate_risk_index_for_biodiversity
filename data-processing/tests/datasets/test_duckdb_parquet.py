import duckdb
import polars as pl
import pytest
from kedro.io.core import DatasetError

from data_processing.datasets import DuckDBParquetGlobDataset


@pytest.fixture
def two_shard_parquet_glob(tmp_path):
    pl.DataFrame({"x": [1, 2]}).write_parquet(tmp_path / "part-0.parquet")
    pl.DataFrame({"x": [3, 4]}).write_parquet(tmp_path / "part-1.parquet")
    return str(tmp_path / "*.parquet")


def test_load_returns_a_relation_over_every_shard(two_shard_parquet_glob):
    dataset = DuckDBParquetGlobDataset(filepath=two_shard_parquet_glob)

    relation = dataset.load()

    assert isinstance(relation, duckdb.DuckDBPyRelation)
    assert sorted(relation.pl()["x"]) == [1, 2, 3, 4]


def test_exists_is_true_only_when_a_shard_matches(tmp_path, two_shard_parquet_glob):
    assert DuckDBParquetGlobDataset(filepath=two_shard_parquet_glob).exists()
    assert not DuckDBParquetGlobDataset(
        filepath=str(tmp_path / "*.does-not-exist")
    ).exists()


def test_save_is_not_supported(two_shard_parquet_glob):
    dataset = DuckDBParquetGlobDataset(filepath=two_shard_parquet_glob)

    with pytest.raises(DatasetError):
        dataset.save(None)
