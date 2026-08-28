from fastapi import APIRouter, HTTPException

from app.analyzers.python_analyzer import PythonAnalyzer, SyntaxAnalysisError
from app.models import AnalyzeRequest, AnalysisResult

router = APIRouter(prefix="/api/v1")
analyzer = PythonAnalyzer()


@router.post("/analyze", response_model=AnalysisResult)
def analyze(payload: AnalyzeRequest) -> AnalysisResult:
    try:
        return analyzer.analyze(payload.source)
    except SyntaxAnalysisError as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "message": exc.message,
                "lineno": exc.lineno,
                "offset": exc.offset,
            },
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"message": str(exc)}) from exc


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "language": "python", "engine": "radon"}
