import sqlite3
import os
import uuid
import json
from typing import List, Optional
from app.size_models import (
    SizeProject, FPComponent, GSCRating, SizeSnapshot, SizeStudentInfo
)

DB_PATH = os.path.join(os.path.dirname(__file__), "size.sqlite3")

STANDARD_GSC_NAMES = [
    "Data Communications",
    "Distributed Data Processing",
    "Performance Objectives",
    "Heavily Used Configuration",
    "Transaction Rate",
    "Online Data Entry",
    "End-User Efficiency",
    "Online Update",
    "Complex Processing",
    "Reusability",
    "Installation Ease",
    "Operational Ease",
    "Multiple Sites",
    "Facilitate Change"
]


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Creates SQLite tables for Size Estimation objects and ensures a clean start.
    """
    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS size_projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            project_type TEXT NOT NULL,
            language TEXT NOT NULL
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS size_student_info (
            project_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            registration_number TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES size_projects(id) ON DELETE CASCADE
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS size_fp_components (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            complexity TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES size_projects(id) ON DELETE CASCADE
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS size_gsc_ratings (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            characteristic_name TEXT NOT NULL,
            rating INTEGER NOT NULL,
            FOREIGN KEY (project_id) REFERENCES size_projects(id) ON DELETE CASCADE
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS size_snapshots (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            label TEXT NOT NULL,
            ufp INTEGER NOT NULL,
            vaf REAL NOT NULL,
            afp REAL NOT NULL,
            kloc REAL NOT NULL,
            effort_pm REAL NOT NULL,
            time_months REAL NOT NULL,
            avg_team_size REAL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES size_projects(id) ON DELETE CASCADE
        )
        """)

        conn.commit()



# --- PROJECTS & STUDENT INFO ---

def get_projects() -> List[SizeProject]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, description, project_type, language FROM size_projects")
        rows = cursor.fetchall()
        return [
            SizeProject(
                id=r["id"], name=r["name"], description=r["description"],
                project_type=r["project_type"], language=r["language"]
            )
            for r in rows
        ]


def get_project(project_id: str) -> Optional[SizeProject]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, description, project_type, language FROM size_projects WHERE id = ?", (project_id,))
        r = cursor.fetchone()
        if r:
            return SizeProject(
                id=r["id"], name=r["name"], description=r["description"],
                project_type=r["project_type"], language=r["language"]
            )
        return None


def create_project(project_id: str, name: str, description: str, project_type: str, language: str) -> SizeProject:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO size_projects (id, name, description, project_type, language) VALUES (?, ?, ?, ?, ?)",
            (project_id, name, description, project_type, language)
        )
        # Initialize 14 GSC ratings (rated 0 default)
        for gsc_name in STANDARD_GSC_NAMES:
            gsc_id = f"gsc-{uuid.uuid4().hex[:8]}"
            cursor.execute(
                "INSERT OR REPLACE INTO size_gsc_ratings (id, project_id, characteristic_name, rating) VALUES (?, ?, ?, ?)",
                (gsc_id, project_id, gsc_name, 0)
            )
        conn.commit()
    return SizeProject(id=project_id, name=name, description=description, project_type=project_type, language=language)


def update_project_settings(project_id: str, project_type: str, language: str) -> Optional[SizeProject]:
    p = get_project(project_id)
    if not p:
        return None
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE size_projects SET project_type = ?, language = ? WHERE id = ?",
            (project_type, language, project_id)
        )
        conn.commit()
    p.project_type = project_type
    p.language = language
    return p


def save_student_info(project_id: str, info: SizeStudentInfo) -> SizeStudentInfo:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO size_student_info (project_id, name, registration_number) VALUES (?, ?, ?)",
            (project_id, info.name, info.registration_number)
        )
        conn.commit()
    return info


def get_student_info(project_id: str) -> Optional[SizeStudentInfo]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name, registration_number FROM size_student_info WHERE project_id = ?", (project_id,))
        r = cursor.fetchone()
        if r:
            return SizeStudentInfo(name=r["name"], registration_number=r["registration_number"])
        return None


# --- FP COMPONENTS ---

def get_components(project_id: str) -> List[FPComponent]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, project_id, name, type, complexity FROM size_fp_components WHERE project_id = ?", (project_id,))
        rows = cursor.fetchall()
        return [
            FPComponent(
                id=r["id"], project_id=r["project_id"], name=r["name"],
                type=r["type"], complexity=r["complexity"]
            )
            for r in rows
        ]


def save_component(comp: FPComponent) -> FPComponent:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO size_fp_components (id, project_id, name, type, complexity) VALUES (?, ?, ?, ?, ?)",
            (comp.id, comp.project_id, comp.name, comp.type, comp.complexity)
        )
        conn.commit()
    return comp


def delete_component(project_id: str, comp_id: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM size_fp_components WHERE project_id = ? AND id = ?", (project_id, comp_id))
        conn.commit()


# --- GSC RATINGS ---

def get_gsc_ratings(project_id: str) -> List[GSCRating]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, project_id, characteristic_name, rating FROM size_gsc_ratings WHERE project_id = ?", (project_id,))
        rows = cursor.fetchall()
        return [
            GSCRating(
                id=r["id"], project_id=r["project_id"],
                characteristic_name=r["characteristic_name"], rating=r["rating"]
            )
            for r in rows
        ]


def save_gsc_ratings(project_id: str, ratings: List[tuple[str, int]]):
    with get_connection() as conn:
        cursor = conn.cursor()
        for name, r_val in ratings:
            cursor.execute(
                "UPDATE size_gsc_ratings SET rating = ? WHERE project_id = ? AND LOWER(characteristic_name) = LOWER(?)",
                (r_val, project_id, name)
            )
            if cursor.rowcount == 0:
                gsc_id = f"gsc-{uuid.uuid4().hex[:8]}"
                cursor.execute(
                    "INSERT INTO size_gsc_ratings (id, project_id, characteristic_name, rating) VALUES (?, ?, ?, ?)",
                    (gsc_id, project_id, name, r_val)
                )
        conn.commit()



# --- SNAPSHOTS ---

def save_snapshot(snap: SizeSnapshot) -> SizeSnapshot:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT OR REPLACE INTO size_snapshots 
               (id, project_id, label, ufp, vaf, afp, kloc, effort_pm, time_months, avg_team_size, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                snap.id, snap.project_id, snap.label, snap.ufp, snap.vaf, snap.afp,
                snap.kloc, snap.effort_pm, snap.time_months, snap.avg_team_size, snap.created_at
            )
        )
        conn.commit()
    return snap


def get_snapshots(project_id: str) -> List[SizeSnapshot]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM size_snapshots WHERE project_id = ? ORDER BY created_at ASC", (project_id,))
        rows = cursor.fetchall()
        return [
            SizeSnapshot(
                id=r["id"], project_id=r["project_id"], label=r["label"],
                ufp=r["ufp"], vaf=r["vaf"], afp=r["afp"], kloc=r["kloc"],
                effort_pm=r["effort_pm"], time_months=r["time_months"],
                avg_team_size=r["avg_team_size"], created_at=r["created_at"]
            )
            for r in rows
        ]


def reset_project(project_id: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM size_fp_components WHERE project_id = ?", (project_id,))
        cursor.execute("DELETE FROM size_gsc_ratings WHERE project_id = ?", (project_id,))
        cursor.execute("DELETE FROM size_snapshots WHERE project_id = ?", (project_id,))
        cursor.execute("DELETE FROM size_student_info WHERE project_id = ?", (project_id,))

        # Re-initialize GSCs to 0
        for gsc_name in STANDARD_GSC_NAMES:
            gsc_id = f"gsc-{uuid.uuid4().hex[:8]}"
            cursor.execute(
                "INSERT OR REPLACE INTO size_gsc_ratings (id, project_id, characteristic_name, rating) VALUES (?, ?, ?, ?)",
                (gsc_id, project_id, gsc_name, 0)
            )
        conn.commit()
