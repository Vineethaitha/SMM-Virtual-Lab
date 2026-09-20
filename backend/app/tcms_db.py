import sqlite3
import json
import os
from typing import List, Optional
from app.tcms_models import (
    Project, Requirement, TestCase, TestPlan, TestRun, TestRunResultItem, StudentInfo
)

DB_PATH = os.path.join(os.path.dirname(__file__), "tcms.sqlite3")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Creates empty tables for Kiwi TCMS objects.
    No demo/sample projects are seeded — project list starts empty until student creates one.
    """
    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS student_info (
            project_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            registration_number TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS requirements (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            req_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_cases (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            tc_id TEXT NOT NULL,
            title TEXT NOT NULL,
            tier TEXT NOT NULL,
            preconditions TEXT NOT NULL,
            steps TEXT NOT NULL,
            expected_result TEXT NOT NULL,
            priority TEXT NOT NULL,
            linked_requirement_ids TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_plans (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            test_case_ids TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_runs (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            test_plan_id TEXT NOT NULL,
            executed_at TEXT NOT NULL,
            results TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
        """)

        conn.commit()


# --- PROJECTS & STUDENT INFO ---

def get_projects() -> List[Project]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, description FROM projects")
        rows = cursor.fetchall()
        return [Project(id=r["id"], name=r["name"], description=r["description"]) for r in rows]


def get_project(project_id: str) -> Optional[Project]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, description FROM projects WHERE id = ?", (project_id,))
        r = cursor.fetchone()
        if r:
            return Project(id=r["id"], name=r["name"], description=r["description"])
        return None


def create_project(project_id: str, name: str, description: str) -> Project:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO projects (id, name, description) VALUES (?, ?, ?)",
            (project_id, name, description)
        )
        conn.commit()
    return Project(id=project_id, name=name, description=description)


def save_student_info(project_id: str, info: StudentInfo) -> StudentInfo:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO student_info (project_id, name, registration_number) VALUES (?, ?, ?)",
            (project_id, info.name, info.registration_number)
        )
        conn.commit()
    return info


def get_student_info(project_id: str) -> Optional[StudentInfo]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name, registration_number FROM student_info WHERE project_id = ?", (project_id,))
        r = cursor.fetchone()
        if r:
            return StudentInfo(name=r["name"], registration_number=r["registration_number"])
        return None


# --- REQUIREMENTS ---

def get_requirements(project_id: str) -> List[Requirement]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, project_id, req_id, title, description, category, priority FROM requirements WHERE project_id = ?",
            (project_id,)
        )
        rows = cursor.fetchall()
        return [
            Requirement(
                id=r["id"], project_id=r["project_id"], req_id=r["req_id"],
                title=r["title"], description=r["description"],
                category=r["category"], priority=r["priority"]
            )
            for r in rows
        ]


def save_requirement(req: Requirement) -> Requirement:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT OR REPLACE INTO requirements 
               (id, project_id, req_id, title, description, category, priority)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (req.id, req.project_id, req.req_id, req.title, req.description, req.category, req.priority)
        )
        conn.commit()
    return req


def delete_requirement(project_id: str, req_id: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM requirements WHERE project_id = ? AND (id = ? OR req_id = ?)", (project_id, req_id, req_id))
        conn.commit()


# --- TEST CASES ---

def get_test_cases(project_id: str) -> List[TestCase]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, project_id, tc_id, title, tier, preconditions, steps, expected_result, priority, linked_requirement_ids FROM test_cases WHERE project_id = ?",
            (project_id,)
        )
        rows = cursor.fetchall()
        return [
            TestCase(
                id=r["id"], project_id=r["project_id"], tc_id=r["tc_id"],
                title=r["title"], tier=r["tier"], preconditions=r["preconditions"],
                steps=json.loads(r["steps"]), expected_result=r["expected_result"],
                priority=r["priority"], linked_requirement_ids=json.loads(r["linked_requirement_ids"])
            )
            for r in rows
        ]


def save_test_case(tc: TestCase) -> TestCase:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT OR REPLACE INTO test_cases
               (id, project_id, tc_id, title, tier, preconditions, steps, expected_result, priority, linked_requirement_ids)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                tc.id, tc.project_id, tc.tc_id, tc.title, tc.tier, tc.preconditions,
                json.dumps(tc.steps), tc.expected_result, tc.priority, json.dumps(tc.linked_requirement_ids)
            )
        )
        conn.commit()
    return tc


def delete_test_case(project_id: str, tc_id: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM test_cases WHERE project_id = ? AND (id = ? OR tc_id = ?)", (project_id, tc_id, tc_id))
        conn.commit()


# --- TEST PLANS & RUNS ---

def get_test_plans(project_id: str) -> List[TestPlan]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, project_id, name, test_case_ids FROM test_plans WHERE project_id = ?", (project_id,))
        rows = cursor.fetchall()
        return [
            TestPlan(
                id=r["id"], project_id=r["project_id"], name=r["name"],
                test_case_ids=json.loads(r["test_case_ids"])
            )
            for r in rows
        ]


def save_test_plan(plan: TestPlan) -> TestPlan:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO test_plans (id, project_id, name, test_case_ids) VALUES (?, ?, ?, ?)",
            (plan.id, plan.project_id, plan.name, json.dumps(plan.test_case_ids))
        )
        conn.commit()
    return plan


def get_test_runs(project_id: str) -> List[TestRun]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, project_id, test_plan_id, executed_at, results FROM test_runs WHERE project_id = ?", (project_id,))
        rows = cursor.fetchall()
        res_list = []
        for r in rows:
            raw_results = json.loads(r["results"])
            items = [TestRunResultItem(**item) for item in raw_results]
            res_list.append(
                TestRun(
                    id=r["id"], project_id=r["project_id"],
                    test_plan_id=r["test_plan_id"], executed_at=r["executed_at"],
                    results=items
                )
            )
        return res_list


def save_test_run(run: TestRun) -> TestRun:
    with get_connection() as conn:
        cursor = conn.cursor()
        raw_results = [item.model_dump() for item in run.results]
        cursor.execute(
            "INSERT OR REPLACE INTO test_runs (id, project_id, test_plan_id, executed_at, results) VALUES (?, ?, ?, ?, ?)",
            (run.id, run.project_id, run.test_plan_id, run.executed_at, json.dumps(raw_results))
        )
        conn.commit()
    return run


def reset_project(project_id: str):
    """
    Clears all rows for the specified project.
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM requirements WHERE project_id = ?", (project_id,))
        cursor.execute("DELETE FROM test_cases WHERE project_id = ?", (project_id,))
        cursor.execute("DELETE FROM test_plans WHERE project_id = ?", (project_id,))
        cursor.execute("DELETE FROM test_runs WHERE project_id = ?", (project_id,))
        cursor.execute("DELETE FROM student_info WHERE project_id = ?", (project_id,))
        conn.commit()
