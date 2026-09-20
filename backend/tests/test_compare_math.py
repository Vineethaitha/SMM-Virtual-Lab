def pct_change(before: float, after: float) -> float | None:
    """Same formula as frontend/src/lib/utils.ts pctChange."""
    if before == 0:
        return 0.0 if after == 0 else None
    return ((after - before) / abs(before)) * 100


def test_pct_change():
    assert abs(pct_change(100, 80) - (-20.0)) < 1e-9
    assert abs(pct_change(50, 75) - 50.0) < 1e-9
    assert pct_change(0, 0) == 0.0
    assert pct_change(0, 5) is None
