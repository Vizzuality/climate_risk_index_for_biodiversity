"""Smoke test: the project's pipelines register and wire up correctly."""

from pathlib import Path

from kedro.framework.project import pipelines
from kedro.framework.session import KedroSession
from kedro.framework.startup import bootstrap_project


class TestKedroRun:
    def test_project_registers_pipelines(self):
        bootstrap_project(Path.cwd())

        with KedroSession.create(project_path=Path.cwd()):
            assert "processing" in pipelines
            assert len(pipelines["__default__"].nodes) > 0
