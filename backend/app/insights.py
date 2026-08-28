from __future__ import annotations

from app.models import (
    FunctionMetrics,
    HalsteadMetrics,
    Insight,
    LocMetrics,
    MaintainabilityMetrics,
    MetricExplanation,
)

CC_HIGH = 10
CC_MODERATE = 6
NEST_HIGH = 3


def explanations() -> list[MetricExplanation]:
    return [
        MetricExplanation(
            family="loc",
            title="Lines of Code (LOC family)",
            what=(
                "LOC counts physical lines. SLOC is source lines (no blanks/comments). "
                "LLOC counts logical statements. Comments and blanks describe documentation density."
            ),
            how=(
                "Radon raw.analyze scans the file: LOC = all lines; SLOC = non-blank non-comment "
                "source; LLOC = statements. Identity: SLOC + Multi + single comments + blank = LOC."
            ),
            meaning=(
                "High LOC is not automatically bad, but large functions are harder to test. "
                "Prefer splitting work when SLOC grows while cyclomatic complexity also rises."
            ),
        ),
        MetricExplanation(
            family="cyclomatic",
            title="Cyclomatic Complexity (McCabe)",
            what=(
                "Cyclomatic complexity M is the number of independent execution paths. "
                "Each decision (if, elif, for, while, except, and/or) adds a path."
            ),
            how=(
                "McCabe: M = E − N + 2P for a CFG with E edges, N nodes, P connected components. "
                "Radon counts predicates in the AST (equivalent for structured Python)."
            ),
            meaning=(
                "Radon ranks A (1–5) simple, B (6–10) moderate, C–F increasingly risky. "
                "Functions ranked C or worse are prime refactoring targets."
            ),
        ),
        MetricExplanation(
            family="halstead",
            title="Halstead Metrics",
            what=(
                "Halstead treats code as operators and operands. Vocabulary η = η1 + η2, "
                "length N = N1 + N2, volume V = N log2(η), difficulty D = (η1/2)×(N2/η2), "
                "effort E = D × V."
            ),
            how=(
                "Radon HalsteadVisitor walks the AST, classifying tokens as operators or operands, "
                "then applies the closed-form formulas. Nothing is executed."
            ),
            meaning=(
                "Volume estimates information content; difficulty and effort estimate how hard "
                "the code is to write or review. Nested conditions inflate operators and effort."
            ),
        ),
        MetricExplanation(
            family="maintainability",
            title="Maintainability Index (MI)",
            what=(
                "MI is a 0–100 composite of Halstead volume, cyclomatic complexity, SLOC, "
                "and comment ratio. Higher is easier to maintain."
            ),
            how=(
                "Radon: MI = 171 − 5.2 ln(V) − 0.23 CC − 16.2 ln(SLOC) + 50 sin(sqrt(2.4 × comment ratio)), "
                "then scaled to 0–100. Rank A ≥20, B 10–19, C 0–9 (Radon scale)."
            ),
            meaning=(
                "A falling MI after a change signals the module got harder to maintain. "
                "Improving MI after a refactor is evidence the change helped."
            ),
        ),
    ]


def generate_insights(
    loc: LocMetrics,
    functions: list[FunctionMetrics],
    halstead: HalsteadMetrics,
    maintainability: MaintainabilityMetrics,
) -> list[Insight]:
    insights: list[Insight] = []

    complex_fns = [f for f in functions if f.is_complex]
    if complex_fns:
        for fn in sorted(complex_fns, key=lambda f: f.cc, reverse=True):
            insights.append(
                Insight(
                    severity="critical" if fn.cc >= CC_HIGH else "warning",
                    title=f"Function {fn.name} has high complexity.",
                    detail=(
                        f"{fn.qualified_name} has cyclomatic complexity {fn.cc} (rank {fn.rank}) "
                        f"and nested decision depth {fn.nested_decision_depth}. "
                        "Consider simplifying conditions or extracting logic."
                    ),
                    function=fn.name,
                    lineno=fn.lineno,
                )
            )
    else:
        insights.append(
            Insight(
                severity="info",
                title="No high-complexity functions detected.",
                detail="All functions are at or below the moderate McCabe threshold (CC < 10).",
            )
        )

    nested = [f for f in functions if f.nested_decision_depth >= NEST_HIGH]
    if nested:
        names = ", ".join(f.name for f in nested)
        insights.append(
            Insight(
                severity="warning",
                title="Nested decisions increase execution paths.",
                detail=(
                    f"{names} nest decisions {NEST_HIGH}+ levels deep. Each extra predicate "
                    "multiplies independent paths (McCabe) and makes tests harder to enumerate."
                ),
                function=nested[0].name,
                lineno=nested[0].lineno,
            )
        )

    if functions:
        max_cc = max(f.cc for f in functions)
        if loc.sloc > 0 and max_cc >= CC_MODERATE and loc.sloc / max(len(functions), 1) < 8:
            insights.append(
                Insight(
                    severity="info",
                    title="Complexity is driven by decisions, not size.",
                    detail=(
                        "SLOC is modest relative to cyclomatic complexity. Refactoring conditions "
                        "(guard clauses, lookup tables, extracted predicates) will help more than deleting lines."
                    ),
                )
            )

    if halstead.effort > 2000:
        insights.append(
            Insight(
                severity="warning",
                title="Halstead effort is elevated.",
                detail=(
                    f"Effort E = {halstead.effort:.1f} (difficulty {halstead.difficulty:.2f} × "
                    f"volume {halstead.volume:.1f}). Unique operators and operand reuse make the "
                    "module mentally expensive. Extract helpers to shrink vocabulary."
                ),
            )
        )
    elif halstead.volume > 0:
        insights.append(
            Insight(
                severity="info",
                title="Halstead volume reflects information content.",
                detail=(
                    f"Volume V = {halstead.volume:.1f} with vocabulary η = {halstead.vocabulary:.0f}. "
                    "Compare volume after a refactor: a drop usually means simpler expressions."
                ),
            )
        )

    if maintainability.rank in {"B", "C"}:
        insights.append(
            Insight(
                severity="warning" if maintainability.rank == "C" else "info",
                title="Maintainability Index has room to improve.",
                detail=(
                    f"MI is {maintainability.mi} (rank {maintainability.rank}). "
                    "Reducing CC and SLOC while keeping useful comments typically raises MI."
                ),
            )
        )
    else:
        insights.append(
            Insight(
                severity="info",
                title="Maintainability Index is in a healthy band.",
                detail=f"MI is {maintainability.mi} (rank {maintainability.rank}) on Radon's 0–100 scale.",
            )
        )

    insights.append(
        Insight(
            severity="info",
            title="Consider simplifying conditions or extracting logic.",
            detail=(
                "Replace nested if/elif chains with early returns, helper predicates, or data-driven "
                "maps. Re-analyze and compare cyclomatic complexity, Halstead effort, and MI."
            ),
        )
    )
    return insights
