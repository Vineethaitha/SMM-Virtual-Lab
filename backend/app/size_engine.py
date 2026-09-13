from typing import List, Dict, Any, Optional
from app.size_models import (
    SizeProject, FPComponent, GSCRating, SizeMetricsResult, CocomoResult,
    ComplianceRuleResult, SizeComplianceResponse
)

FP_WEIGHTS: Dict[str, Dict[str, int]] = {
    "EI":  {"Low": 3, "Average": 4, "High": 6},
    "EO":  {"Low": 4, "Average": 5, "High": 7},
    "EQ":  {"Low": 3, "Average": 4, "High": 6},
    "ILF": {"Low": 7, "Average": 10, "High": 15},
    "EIF": {"Low": 5, "Average": 7, "High": 10},
}

LOC_PER_FP: Dict[str, int] = {
    "Assembly": 320,
    "C": 128,
    "COBOL": 106,
    "C++": 53,
    "Java": 53,
    "JavaScript": 47,
    "Python": 42,
    "Visual Basic": 32,
}

COCOMO_CONSTANTS: Dict[str, Dict[str, float]] = {
    "organic":       {"a": 2.4, "b": 1.05, "c": 2.5, "d": 0.38},
    "semi_detached": {"a": 3.0, "b": 1.12, "c": 2.5, "d": 0.35},
    "embedded":      {"a": 3.6, "b": 1.20, "c": 2.5, "d": 0.32},
}

IMPROVEMENT_MAP: Dict[str, str] = {
    "component_coverage": "You haven't added any Function Point components yet. Go to the Function Point Counter and list every screen, report, and data store in your project.",
    "complexity_assigned": "Some components are missing a complexity rating. Every EI/EO/EQ/ILF/EIF needs Low, Average, or High assigned.",
    "gsc_completeness": "Not all 14 General System Characteristics have been rated. Go to the GSC panel and rate each one 0–5.",
    "project_type_missing": "Select a COCOMO project type (organic, semi-detached, or embedded) before viewing Effort/Time.",
    "language_missing": "Select an implementation language so AFP can be converted to KLOC.",
    "fp_components_topic": "Revisit Theory > Function Point components table — review the difference between EI, EO, EQ, ILF, and EIF.",
    "ufp_formula_topic": "Revisit Theory > UFP formula — UFP is calculated as the sum of (count × complexity weight) for each component.",
    "vaf_formula_topic": "Revisit Theory > VAF formula — remember VAF = 0.65 + 0.01 × TDI.",
    "vaf_range_topic": "Revisit Theory > VAF range — VAF always falls within the range 0.65 to 1.35.",
    "loc_conversion_topic": "Revisit Theory > LOC Conversion — higher-level languages require fewer lines of code per function point.",
    "cocomo_types_topic": "Revisit Theory > COCOMO project types — review when to pick organic vs semi-detached vs embedded.",
    "cocomo_formula_topic": "Revisit Theory > COCOMO formulas — Effort = a × (KLOC)^b.",
    "cocomo_output_topic": "Revisit Theory > Team Size formula — Average Team Size = Effort / Time.",
    "purpose_topic": "Revisit Theory — Function Point Analysis enables size estimation before code is written.",
}


def compute_ufp(components: List[FPComponent]) -> int:
    ufp = 0
    for c in components:
        weights = FP_WEIGHTS.get(c.type.upper() if c.type else "", {"Low": 3, "Average": 4, "High": 6})
        cmplx = c.complexity.capitalize() if c.complexity else "Average"
        ufp += weights.get(cmplx, 4)
    return ufp



def compute_vaf(gsc_ratings: List[GSCRating]) -> tuple[int, float]:
    tdi = sum(r.rating for r in gsc_ratings)
    vaf = round(0.65 + 0.01 * tdi, 3)
    return tdi, vaf


def compute_afp(ufp: int, vaf: float) -> float:
    return round(ufp * vaf, 2)


def compute_kloc(afp: float, language: str) -> float:
    ratio = LOC_PER_FP.get(language, 42)
    return round((afp * ratio) / 1000.0, 3)


def compute_cocomo(kloc: float, project_type: str) -> CocomoResult:
    k = COCOMO_CONSTANTS.get(project_type, COCOMO_CONSTANTS["organic"])
    if kloc <= 0:
        return CocomoResult(effort_pm=0.0, time_months=0.0, avg_team_size=0.0)

    effort = round(k["a"] * (kloc ** k["b"]), 2)
    time = round(k["c"] * (effort ** k["d"]), 2)
    people = round(effort / time, 2) if time > 0 else 0.0

    return CocomoResult(effort_pm=effort, time_months=time, avg_team_size=people)


def get_size_category_and_note(kloc: float, project_type: str) -> tuple[str, str]:
    if kloc < 2.0:
        size_category = "Very Small"
    elif kloc < 10.0:
        size_category = "Small"
    elif kloc < 50.0:
        size_category = "Medium"
    elif kloc < 300.0:
        size_category = "Large"
    else:
        size_category = "Very Large"

    if project_type == "organic" and kloc > 50.0:
        note = "Your project size suggests 'semi-detached' or 'embedded' may fit better than 'organic'."
    elif project_type == "embedded" and kloc < 50.0:
        note = "Your project size suggests 'organic' or 'semi-detached' may fit better than 'embedded'."
    else:
        note = "Your chosen project type is consistent with the estimated size."

    return size_category, note


def calculate_all_size_metrics(
    project: SizeProject,
    components: List[FPComponent],
    gsc_ratings: List[GSCRating],
) -> SizeMetricsResult:
    ufp = compute_ufp(components)
    tdi, vaf = compute_vaf(gsc_ratings)
    afp = compute_afp(ufp, vaf)
    kloc = compute_kloc(afp, project.language)
    cocomo = compute_cocomo(kloc, project.project_type)
    size_category, consistency_note = get_size_category_and_note(kloc, project.project_type)

    return SizeMetricsResult(
        project_id=project.id,
        total_components=len(components),
        ufp=ufp,
        tdi=tdi,
        vaf=vaf,
        afp=afp,
        loc_per_fp=LOC_PER_FP.get(project.language, 42),
        kloc=kloc,
        cocomo=cocomo,
        size_category=size_category,
        consistency_note=consistency_note,
    )


def check_size_compliance(
    project: SizeProject,
    components: List[FPComponent],
    gsc_ratings: List[GSCRating],
) -> SizeComplianceResponse:
    has_components = len(components) > 0
    rule_comp = ComplianceRuleResult(
        passed=has_components,
        detail=f"{len(components)} component(s) added",
        failing_ids=[] if has_components else ["no_components"]
    )

    missing_complexity = [c for c in components if not c.complexity]
    has_complexity = has_components and len(missing_complexity) == 0
    rule_cmplx = ComplianceRuleResult(
        passed=has_complexity,
        detail=f"{len(missing_complexity)} component(s) missing complexity" if has_components else "No components added yet to evaluate complexity",
        failing_ids=[c.name for c in missing_complexity] if has_components else ["no_components"]
    )

    rated_count = sum(1 for r in gsc_ratings if r.rating > 0)
    has_gsc = len(gsc_ratings) == 14 and rated_count > 0
    rule_gsc = ComplianceRuleResult(
        passed=has_gsc,
        detail=f"{rated_count}/14 General System Characteristics rated",
        failing_ids=[] if has_gsc else ["incomplete_gsc"]
    )

    has_type = bool(project and project.project_type)
    rule_type = ComplianceRuleResult(
        passed=has_type,
        detail=f"Project type selected ({project.project_type})" if has_type else "No project type selected",
        failing_ids=[] if has_type else ["no_project_type"]
    )

    has_lang = bool(project and project.language)
    rule_lang = ComplianceRuleResult(
        passed=has_lang,
        detail=f"Language selected ({project.language})" if has_lang else "No language selected",
        failing_ids=[] if has_lang else ["no_language"]
    )

    rules = [rule_comp, rule_cmplx, rule_gsc, rule_type, rule_lang]
    passed_count = sum(1 for r in rules if r.passed)
    quality_score = round(passed_count / len(rules) * 100.0, 1)

    return SizeComplianceResponse(
        component_coverage=rule_comp,
        complexity_assigned=rule_cmplx,
        gsc_completeness=rule_gsc,
        project_type_missing=rule_type,
        language_missing=rule_lang,
        quality_score=quality_score
    )


def generate_size_improvements(
    compliance: SizeComplianceResponse,
    topic_breakdown: Optional[Dict[str, Dict[str, Any]]] = None
) -> List[str]:
    recommendations: List[str] = []

    if not compliance.component_coverage.passed:
        recommendations.append(IMPROVEMENT_MAP["component_coverage"])
    if not compliance.complexity_assigned.passed:
        recommendations.append(IMPROVEMENT_MAP["complexity_assigned"])
    if not compliance.gsc_completeness.passed:
        recommendations.append(IMPROVEMENT_MAP["gsc_completeness"])
    if not compliance.project_type_missing.passed:
        recommendations.append(IMPROVEMENT_MAP["project_type_missing"])
    if not compliance.language_missing.passed:
        recommendations.append(IMPROVEMENT_MAP["language_missing"])

    if topic_breakdown:
        for topic, data in topic_breakdown.items():
            pct = data.get("percentage", 100.0)
            if pct < 50.0:
                key = f"{topic}_topic"
                if key in IMPROVEMENT_MAP and IMPROVEMENT_MAP[key] not in recommendations:
                    recommendations.append(IMPROVEMENT_MAP[key])

    if not recommendations:
        recommendations.append("Excellent work! Your software size estimation model satisfies all compliance rules and quiz topics.")

    return recommendations
