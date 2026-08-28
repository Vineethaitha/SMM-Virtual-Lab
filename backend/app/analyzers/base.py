from __future__ import annotations

from abc import ABC, abstractmethod

from app.models import AnalysisResult


class CodeAnalyzer(ABC):
    """Extensible analyzer contract. v1 implements Python only."""

    language: str

    @abstractmethod
    def analyze(self, source: str) -> AnalysisResult:
        """Statically analyze source. Must never execute user code."""


# Future analyzers (not implemented in Exercise 1):
# class JavaAnalyzer(CodeAnalyzer): ...
# class CppAnalyzer(CodeAnalyzer): ...
# class JavaScriptAnalyzer(CodeAnalyzer): ...
