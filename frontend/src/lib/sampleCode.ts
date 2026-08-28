export const SAMPLE_PYTHON = `"""SMM Virtual Lab — Exercise 1 sample.
Nested decisions, multiple functions, and a simple helper.
Edit this code, then click Analyze Code.
"""


def helper(n):
    """Low-complexity helper used for comparison."""
    return n * 2


def classify_score(score, late, honors):
    if score < 0 or score > 100:
        return "invalid"
    if late:
        if score >= 90:
            return "A-"
        elif score >= 80:
            return "B-"
        elif score >= 70:
            return "C-"
        else:
            return "F"
    if honors:
        if score >= 95:
            return "A+"
        elif score >= 85:
            return "A"
        else:
            return "B"
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= 60:
        return "D"
    else:
        return "F"


def total_points(items):
    acc = 0
    for item in items:
        acc += item
    return helper(acc)
`;
