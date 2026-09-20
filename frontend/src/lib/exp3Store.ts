import type {
  FPComponentItem,
  GSCRatingItem,
  SizeProjectItem,
  SizeSnapshotItem,
  SizeStudentInfoItem,
} from "@/data/exp3Data";
import { GSC_LIST } from "@/data/exp3Data";

const KEY = "smm-exp3-state";

export interface Exp3ProjectBundle {
  components: FPComponentItem[];
  gsc: GSCRatingItem[];
  snapshots: SizeSnapshotItem[];
  student: SizeStudentInfoItem;
}

export interface Exp3State {
  projects: SizeProjectItem[];
  byProject: Record<string, Exp3ProjectBundle>;
}

function emptyStudent(): SizeStudentInfoItem {
  return { name: "", registration_number: "" };
}

export function initGscRatings(projectId: string): GSCRatingItem[] {
  return GSC_LIST.map((g, idx) => ({
    id: `gsc-${projectId}-${idx}`,
    project_id: projectId,
    characteristic_name: g.name,
    rating: 0,
  }));
}

export function emptyBundle(projectId: string): Exp3ProjectBundle {
  return {
    components: [],
    gsc: initGscRatings(projectId),
    snapshots: [],
    student: emptyStudent(),
  };
}

export function loadExp3State(): Exp3State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { projects: [], byProject: {} };
    const parsed = JSON.parse(raw) as Exp3State;
    if (!parsed || !Array.isArray(parsed.projects) || typeof parsed.byProject !== "object") {
      return { projects: [], byProject: {} };
    }
    return parsed;
  } catch {
    return { projects: [], byProject: {} };
  }
}

export function saveExp3State(state: Exp3State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function newId(prefix: string): string {
  const rand = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}
