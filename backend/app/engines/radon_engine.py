from __future__ import annotations

from radon.complexity import cc_rank, cc_visit
from radon.metrics import h_visit, mi_rank, mi_visit
from radon.raw import analyze as raw_analyze

from app.models import HalsteadMetrics, LocMetrics, MaintainabilityMetrics


def _halstead_from_report(report) -> HalsteadMetrics:
    return HalsteadMetrics(
        h1=float(report.h1),
        h2=float(report.h2),
        n1=float(report.N1),
        n2=float(report.N2),
        vocabulary=float(report.vocabulary),
        length=float(report.length),
        calculated_length=float(report.calculated_length),
        volume=float(report.volume),
        difficulty=float(report.difficulty),
        effort=float(report.effort),
        time=float(report.time),
        bugs=float(report.bugs),
    )


class RadonEngine:
    """Thin wrapper around Radon. Never executes source; AST visitors only."""

    def raw_metrics(self, source: str) -> LocMetrics:
        raw = raw_analyze(source)
        return LocMetrics(
            loc=raw.loc,
            lloc=raw.lloc,
            sloc=raw.sloc,
            comments=raw.comments,
            multi=raw.multi,
            blank=raw.blank,
            single_comments=raw.single_comments,
        )

    def cyclomatic(self, source: str) -> list:
        return list(cc_visit(source))

    def rank_cc(self, complexity: int) -> str:
        return cc_rank(complexity)

    def halstead(self, source: str):
        return h_visit(source)

    def to_halstead_metrics(self, report) -> HalsteadMetrics:
        return _halstead_from_report(report)

    def maintainability(self, source: str) -> MaintainabilityMetrics:
        mi = float(mi_visit(source, multi=True))
        return MaintainabilityMetrics(mi=round(mi, 2), rank=mi_rank(mi))
