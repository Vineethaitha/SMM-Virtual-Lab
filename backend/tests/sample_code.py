SAMPLE = '''
def helper(n):
    """Tiny helper with low complexity."""
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
    return acc
'''
