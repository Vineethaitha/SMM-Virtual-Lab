/**
 * Experiment 7 — Requirement Ambiguity Analysis
 *
 * Sections:
 *   Aim · Objective · Theory · Procedure ·
 *   Self-Review (one-by-one classification) ·
 *   Analysis Table (editable + reference) ·
 *   Exercise (Q&A) · Conclusion
 *
 * All analysis uses formal third-person / passive academic wording.
 */

import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ClipboardPen,
  Download,
  Eye,
  FileSearch,
  FileText,
  Filter,
  Lightbulb,
  Target,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LabQuizCards } from "@/components/exercise/LabQuizCards";
import { ConclusionQuizGate } from "@/components/quiz/ConclusionQuizGate";
import { LabPageShell, type LabPageSection } from "@/components/layout/LabPageShell";
import {
  LabCard,
  LabFormula,
  LabInfoBox,
  LabKpiCard,
  LabStepList,
  LabThresholds,
} from "@/components/lab/LabCard";
import { cn } from "@/lib/utils";

const OPTION_IDLE =
  "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50";
const OPTION_SELECTED = "border-blue-500 bg-blue-50 text-blue-800";
const OPTION_CORRECT = "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold";
const OPTION_INCORRECT = "border-red-400 bg-red-50 text-red-700";
const OPTION_MUTED = "border-slate-100 bg-slate-50 text-slate-400";
const FIELD_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60";

// ─── Section IDs ─────────────────────────────────────────────────────────────
type Exp7Section =
  | "aim"
  | "objective"
  | "theory"
  | "procedure"
  | "selfreview"
  | "table"
  | "exercise"
  | "conclusion";

const SECTIONS: LabPageSection<Exp7Section>[] = [
  { id: "aim",        label: "Aim",          icon: Target       },
  { id: "objective",  label: "Objective",    icon: Lightbulb    },
  { id: "theory",     label: "Theory",       icon: BookOpen     },
  { id: "procedure",  label: "Procedure",    icon: ClipboardList},
  { id: "selfreview", label: "Self-Review",  icon: Eye          },
  { id: "table",      label: "Analysis Table",icon: FileSearch  },
  { id: "exercise",   label: "Exercise",     icon: ClipboardPen },
  { id: "conclusion", label: "Conclusion",   icon: FileText     },
];

// ─── Prose copy ───────────────────────────────────────────────────────────────
const COPY: Record<Exp7Section, { title: string; body: string[] }> = {
  aim: {
    title: "Aim",
    body: [
      "Identify and classify instances of ambiguity, incompleteness, inconsistency, and vague wording in a set of software requirements for a student-attendance management application.",
      "Produce a structured requirement-review table that maps each requirement to its identified issue and proposes a formal clarification, thereby demonstrating the practical application of requirements-quality analysis techniques.",
    ],
  },
  objective: {
    title: "Objective",
    body: [
      "Review each of the 20 given requirements for the student-attendance application against established requirements-quality criteria (IEEE 29148 / SWEBOK).",
      "Classify each issue as: Ambiguous, Incomplete, Conflicting, Vague, or a combination thereof.",
      "Document each finding in a structured four-column review table using formal academic wording.",
      "Propose specific, testable clarifications for every identified issue.",
      "Demonstrate how systematic requirements analysis reduces downstream defects and rework costs.",
    ],
  },
  theory: {
    title: "Theory",
    body: [
      "Requirements quality is a prerequisite for successful software development. A requirement is considered well-formed when it is: correct, unambiguous, complete, consistent, ranked by importance, verifiable, modifiable, and traceable (IEEE 830 / IEEE 29148).",
      "Ambiguity arises when a natural-language statement admits two or more valid interpretations. Common causes include pronoun reference ambiguity, vague quantifiers (e.g., 'quickly', 'large'), and overloaded domain terms.",
      "Incompleteness occurs when a requirement omits preconditions, postconditions, error-handling behaviour, actor roles, or boundary conditions needed to fully specify the expected system behaviour.",
      "Conflicting requirements are two or more statements that cannot simultaneously be satisfied. Conflicts may be direct (contradictory functional rules) or indirect (non-functional constraints that make a functional requirement infeasible).",
      "Vague quantifiers — words such as 'appropriate', 'adequate', 'reasonable', 'fast', 'secure' — resist objective verification and must be replaced by measurable acceptance criteria.",
      "Undefined actors occur when a requirement uses a passive construction or a generic noun (e.g., 'the system', 'users') without specifying which stakeholder role initiates or receives the described behaviour.",
      "Requirement-review techniques include inspection (Fagan), structured walkthrough, automated ambiguity detection (e.g., nocuous ambiguity detection tools), and formal specification methods (Z, Alloy). This experiment applies structured manual review.",
    ],
  },
  procedure: {
    title: "Procedure",
    body: [
      "1. Obtain the requirements document for the student-attendance management application.",
      "2. Read each requirement individually and apply the following checklist: (a) Is the actor clearly identified? (b) Is the action precisely stated? (c) Are all quantities measurable? (d) Are all preconditions and postconditions stated? (e) Does the requirement conflict with any other? (f) Are exception / error paths described?",
      "3. For each issue found, record: the requirement number, the verbatim requirement statement, a formal description of the ambiguity or issue, and the specific clarification needed.",
      "4. Classify each issue using one or more of the following tags: Ambiguous, Incomplete, Conflicting, Vague.",
      "5. Review the completed table as a team to ensure consistency of classification.",
      "6. Summarise the defect distribution by category in the Conclusion section.",
    ],
  },
  selfreview:  { title: "Self-Review Mode",    body: [] },
  table:       { title: "Analysis Table",      body: [] },
  exercise:    { title: "Exercise Questions",  body: [] },
  conclusion: {
    title: "Conclusion",
    body: [
      "The structured review of the 20 student-attendance-app requirements revealed that ambiguity and incompleteness are the most prevalent quality defects in the requirement set. Vague quantifiers ('quickly', 'appropriate', 'minimal') and undefined actors accounted for the majority of ambiguous entries, while omitted error-handling paths and unspecified preconditions were the primary sources of incompleteness.",
      "Two conflicting requirements were identified: the privacy constraint on attendance data (R-11) is potentially incompatible with the administrative bulk-export requirement (R-14) unless role-based access controls are explicitly defined.",
      "The exercise demonstrates that systematic manual review — applying a consistent checklist against each requirement — is an effective and low-cost method for surfacing specification defects before they propagate into design and implementation. Automated ambiguity-detection tools (e.g., ARIES, OSRA) may be employed in conjunction with manual review for larger requirement sets.",
    ],
  },
};

// ─── Requirement data ─────────────────────────────────────────────────────────
type IssueTag = "Ambiguous" | "Incomplete" | "Conflicting" | "Vague";

interface Requirement {
  id: number;
  statement: string;
  issues: IssueTag[];
  ambiguity: string;   // reference analysis
  clarification: string; // reference clarification
}

const REQUIREMENTS: Requirement[] = [
  {
    id: 1, statement: "The system shall allow users to register with their personal information.",
    issues: ["Ambiguous", "Incomplete"],
    ambiguity: "The term 'users' is undefined; the system may serve students, faculty, and administrators, each of whom may require different registration fields. Furthermore, 'personal information' is not enumerated, leaving the required data fields unspecified.",
    clarification: "It is required that the precise actor roles permitted to register be specified (e.g., student, faculty member, administrator). The mandatory and optional fields constituting 'personal information' must be enumerated, with reference to applicable data-protection regulations governing their collection.",
  },
  {
    id: 2, statement: "The system shall provide a login page for students and teachers.",
    issues: ["Incomplete"],
    ambiguity: "The requirement does not specify how authentication is performed (e.g., username/password, institutional SSO, biometric), nor does it address security requirements such as account lockout policy, session timeout, or multi-factor authentication.",
    clarification: "The authentication mechanism, credential format, session-duration limit, maximum failed-attempt policy, and applicability of multi-factor authentication must be defined. The handling of forgotten credentials must also be addressed.",
  },
  {
    id: 3, statement: "The system shall allow the teacher to mark attendance for each class.",
    issues: ["Incomplete"],
    ambiguity: "The requirement does not define the time window within which attendance may be marked, whether attendance may be amended after submission, the granularity of marking (present/absent/late), or the handling of classes with no registered students.",
    clarification: "The permitted time window for marking attendance relative to the scheduled class time must be stated. Permissible attendance statuses (e.g., present, absent, late, excused) must be enumerated, together with the policy governing amendment of previously submitted records.",
  },
  {
    id: 4, statement: "The system should send a notification to students when their attendance is low.",
    issues: ["Vague", "Incomplete"],
    ambiguity: "The modal verb 'should' introduces ambiguity regarding whether this is a mandatory or optional feature. The threshold defining 'low attendance' is unspecified, as is the notification channel (email, SMS, in-app), frequency, and the responsible triggering actor.",
    clarification: "The requirement must use 'shall' if mandatory. A measurable threshold for low attendance (e.g., below 75% within a rolling 30-day period) must be defined. The notification channel, delivery frequency, and the actor or automated process responsible for triggering notifications must be specified.",
  },
  {
    id: 5, statement: "The system shall generate attendance reports for the administrator.",
    issues: ["Incomplete"],
    ambiguity: "The scope of the report (per class, per student, institutional aggregate), the output format, the date range, and the delivery mechanism are all unspecified. It is also unclear whether reports are generated on demand or on a scheduled basis.",
    clarification: "The required report types, their constituent data fields, permissible output formats (PDF, CSV, XLSX), the configurable date range, and whether generation is on-demand or scheduled must all be defined. Access control governing which administrative roles may generate or view each report type must also be specified.",
  },
  {
    id: 6, statement: "The system shall store student attendance data securely.",
    issues: ["Vague"],
    ambiguity: "The term 'securely' is subjective and does not constitute a verifiable requirement. No encryption standard, access-control model, retention period, or regulatory compliance framework is referenced.",
    clarification: "The specific security controls required must be stated: encryption standard (e.g., AES-256 at rest, TLS 1.3 in transit), the role-based access-control model, the data-retention and deletion schedule, and the applicable regulatory standards (e.g., FERPA, GDPR) with which compliance is required.",
  },
  {
    id: 7, statement: "The system shall allow students to view their own attendance records.",
    issues: ["Incomplete"],
    ambiguity: "The historical depth of viewable records is not specified. The requirement does not address whether students may dispute or annotate records, nor does it specify the viewing interface (web, mobile, or both).",
    clarification: "The retention period for records visible to students must be specified. The availability of dispute or correction mechanisms and the target client platforms (web browser, native mobile application) must also be defined.",
  },
  {
    id: 8, statement: "The system should be fast and responsive.",
    issues: ["Vague"],
    ambiguity: "'Fast' and 'responsive' are subjective adjectives that cannot be objectively verified. No latency targets, throughput benchmarks, or concurrency parameters are provided.",
    clarification: "Measurable performance criteria must be stated. For example: page-load time must not exceed 2 seconds for 95% of requests under a concurrent load of 500 users; API response time for attendance-submission operations must not exceed 500 milliseconds at the 99th percentile.",
  },
  {
    id: 9, statement: "The system shall allow the admin to add or remove courses.",
    issues: ["Incomplete"],
    ambiguity: "The cascading effects of course removal on existing attendance records, enrolled students, and scheduled sessions are unspecified. The requirement does not define whether removal is a soft-delete (archival) or a hard-delete operation.",
    clarification: "The data-retention policy for records associated with removed courses must be defined. The cascading operations (unenrolment, archival of attendance records, notification to affected students) must be specified, together with the distinction between soft and hard deletion.",
  },
  {
    id: 10, statement: "The system shall support multiple languages.",
    issues: ["Incomplete", "Vague"],
    ambiguity: "The specific languages to be supported are not enumerated. The scope of localisation (UI labels only, date/time formatting, right-to-left layout, report content) is unspecified, as is the mechanism for selecting or changing the active language.",
    clarification: "The set of supported languages must be listed explicitly. The components subject to localisation must be enumerated (UI text, error messages, report templates, date and number formats). The language-selection mechanism and the handling of untranslated content must be defined.",
  },
  {
    id: 11, statement: "The system shall ensure that student attendance data is not shared with unauthorised parties.",
    issues: ["Incomplete", "Ambiguous"],
    ambiguity: "The term 'unauthorised parties' presupposes a defined authorisation model, which has not been specified. The requirement does not define which roles constitute 'authorised' parties, nor does it address external integrations, audit logging, or data-breach response procedures.",
    clarification: "The authorised roles and their corresponding data-access permissions must be specified in a role-based access-control matrix. The handling of third-party integrations, audit-log requirements, and the incident-response procedure in the event of unauthorised access must also be defined.",
  },
  {
    id: 12, statement: "The system shall allow teachers to upload course materials.",
    issues: ["Incomplete"],
    ambiguity: "The maximum permissible file size, accepted file formats, storage quota per teacher, and virus-scanning or content-moderation requirements are not specified. The visibility of uploaded materials to students is also unaddressed.",
    clarification: "Maximum file size per upload, accepted MIME types, aggregate storage quota, virus-scanning policy, and the access-control rules governing student visibility of uploaded materials must be defined.",
  },
  {
    id: 13, statement: "The system shall provide a dashboard showing attendance statistics.",
    issues: ["Incomplete", "Ambiguous"],
    ambiguity: "The intended audience of the dashboard (student, teacher, administrator, or all) is ambiguous. The specific statistics, chart types, and filtering options to be displayed are unspecified.",
    clarification: "The target user role(s) for each dashboard view must be specified. The required statistical measures (e.g., attendance percentage, trend over time, class-level vs. institution-level aggregates), visualisation types, and interactive filtering options must be enumerated.",
  },
  {
    id: 14, statement: "The system shall allow the admin to export all student data.",
    issues: ["Incomplete", "Conflicting"],
    ambiguity: "This requirement potentially conflicts with Requirement 11, which mandates that student data not be shared with unauthorised parties, unless the admin role is explicitly authorised for full data export. The data scope ('all student data'), export format, and applicable data-protection constraints are unspecified.",
    clarification: "The conflict with Requirement 11 must be resolved by explicitly defining the admin role's data-access permissions in the authorisation model. The scope of exportable data, the required formats, the retention obligations for exported files, and any applicable regulatory constraints (e.g., GDPR data-minimisation principle) must be specified.",
  },
  {
    id: 15, statement: "The system shall send automated reminders to students before class.",
    issues: ["Incomplete", "Vague"],
    ambiguity: "The lead time for reminders ('before class') is unspecified. The notification channel, the content of the reminder message, opt-out capability, and the handling of cancelled or rescheduled classes are not addressed.",
    clarification: "The precise lead time for reminder delivery (e.g., 24 hours and 1 hour before the scheduled class) must be defined. The notification channel (push notification, email, SMS), message content, opt-out mechanism, and behaviour in the case of class cancellation or rescheduling must all be specified.",
  },
  {
    id: 16, statement: "The system shall allow students to apply for leave.",
    issues: ["Incomplete"],
    ambiguity: "The leave-application workflow is unspecified: it is unclear who approves or rejects applications, what information is required, within what timeframe applications must be submitted, and how approved leave affects the attendance record.",
    clarification: "The approval workflow (approver role, approval criteria, response time SLA) must be defined. Required fields for a leave application, the permissible submission window relative to the class date, and the effect of approved leave on the attendance percentage calculation must be specified.",
  },
  {
    id: 17, statement: "The system shall be available 24/7.",
    issues: ["Incomplete", "Vague"],
    ambiguity: "Continuous availability is stated but no permissible downtime is quantified. No Service Level Agreement (SLA), planned-maintenance window, recovery-time objective (RTO), or recovery-point objective (RPO) is specified.",
    clarification: "The required availability percentage (e.g., 99.5% measured monthly), the permitted planned-maintenance window, the RTO and RPO in the event of unplanned outage, and the monitoring and alerting obligations must all be specified.",
  },
  {
    id: 18, statement: "The system shall provide a search function to find students quickly.",
    issues: ["Vague", "Incomplete"],
    ambiguity: "The adverb 'quickly' is subjective and unmeasurable. The searchable attributes (name, student ID, course, cohort), the scope of search results, required access permissions, and the handling of partial or fuzzy matches are unspecified.",
    clarification: "Search response time must be stated as a measurable criterion (e.g., results returned within 1 second for queries against a database of up to 10,000 student records). The searchable fields, result-set scope, pagination policy, and the minimum role permitted to execute each search type must be defined.",
  },
  {
    id: 19, statement: "The system shall maintain logs of all activities.",
    issues: ["Incomplete", "Vague"],
    ambiguity: "The scope of 'all activities' is undefined: it is unclear whether this encompasses user-authentication events, data-modification operations, report generation, system errors, or all of the above. Retention period, log format, access permissions, and tamper-evidence requirements are unspecified.",
    clarification: "The categories of events to be logged must be enumerated. The log format (e.g., structured JSON with ISO 8601 timestamps), the minimum retention period, the roles authorised to access logs, and the tamper-evidence or integrity-verification mechanism must be specified.",
  },
  {
    id: 20, statement: "The system shall handle errors appropriately.",
    issues: ["Ambiguous", "Vague"],
    ambiguity: "The term 'appropriately' is entirely subjective. No error taxonomy is provided. The requirement does not specify user-facing error messages, recovery actions, logging obligations, or escalation procedures for critical failures.",
    clarification: "An error taxonomy must be defined (e.g., validation error, authentication failure, system error, third-party integration failure). For each category, the required user-facing message format, the system recovery action, the logging obligation, and the escalation path to operations or development personnel must be specified.",
  },
];

// ─── Shared constants ─────────────────────────────────────────────────────────
type FilterOption = "All" | IssueTag;
const FILTER_OPTIONS: FilterOption[] = ["All", "Ambiguous", "Incomplete", "Conflicting", "Vague"];

const ISSUE_BADGE_VARIANT: Record<IssueTag, "warn" | "crit" | "ok" | "default"> = {
  Ambiguous:   "warn",
  Incomplete:  "default",
  Conflicting: "crit",
  Vague:       "ok",
};

const ALL_TAGS: IssueTag[] = ["Ambiguous", "Incomplete", "Conflicting", "Vague"];

const SECTION_ICONS: Record<Exp7Section, typeof Target> = {
  aim: Target,
  objective: Lightbulb,
  theory: BookOpen,
  procedure: ClipboardList,
  selfreview: Eye,
  table: FileSearch,
  exercise: ClipboardPen,
  conclusion: FileText,
};

function ProseCard({ section }: { section: Exp7Section }) {
  const copy = COPY[section];
  if (!copy.body.length) return null;
  return (
    <LabCard title={copy.title} icon={SECTION_ICONS[section]}>
      <div className="max-w-4xl space-y-3 text-sm leading-relaxed text-slate-600">
        {copy.body.map((p) => (
          <p key={p.slice(0, 48)}>{p}</p>
        ))}
      </div>
    </LabCard>
  );
}

function TheoryPanel() {
  return (
    <div className="space-y-4">
      <ProseCard section="theory" />
      <LabCard title="Well-formed requirement (IEEE 830 / IEEE 29148)" icon={BookOpen}>
        <LabFormula>
          Well-formed = correct, unambiguous, complete, consistent, ranked, verifiable, modifiable, and traceable
        </LabFormula>
        <div className="mt-3">
          <LabThresholds
            caption="Quality defects classified in this experiment:"
            rows={[
              { range: "Ambiguous", label: "Multiple valid interpretations", color: "bg-amber-100 text-amber-800" },
              { range: "Incomplete", label: "Missing preconditions / actors / error paths", color: "bg-slate-100 text-slate-700" },
              { range: "Conflicting", label: "Contradicts another requirement", color: "bg-rose-100 text-rose-800" },
              { range: "Vague", label: "Unverifiable / unmeasurable language", color: "bg-emerald-100 text-emerald-800" },
            ]}
          />
        </div>
      </LabCard>
      <div className="grid gap-4 md:grid-cols-2">
        <LabCard title="Ambiguous">
          <LabFormula>A natural-language statement admits two or more valid interpretations</LabFormula>
          <div className="mt-3">
            <LabThresholds
              rows={[
                { range: "Pronouns", label: "Unclear actor / reference", color: "bg-amber-100 text-amber-800" },
                { range: "Quantifiers", label: "e.g. quickly, large", color: "bg-amber-50 text-amber-800" },
                { range: "Domain terms", label: "Overloaded vocabulary", color: "bg-slate-100 text-slate-700" },
              ]}
            />
          </div>
        </LabCard>
        <LabCard title="Incomplete">
          <LabFormula>Omits preconditions, postconditions, error-handling, actors, or boundary conditions</LabFormula>
          <div className="mt-3">
            <LabThresholds
              rows={[
                { range: "Actors", label: "Role not identified", color: "bg-slate-100 text-slate-700" },
                { range: "Error paths", label: "Exceptions unspecified", color: "bg-blue-100 text-blue-800" },
                { range: "Boundaries", label: "Limits omitted", color: "bg-blue-50 text-blue-800" },
              ]}
            />
          </div>
        </LabCard>
        <LabCard title="Conflicting">
          <LabFormula>Two or more statements that cannot simultaneously be satisfied</LabFormula>
          <div className="mt-3">
            <LabThresholds
              rows={[
                { range: "Direct", label: "Contradictory functional rules", color: "bg-rose-100 text-rose-800" },
                { range: "Indirect", label: "NFR makes a function infeasible", color: "bg-rose-50 text-rose-800" },
              ]}
            />
          </div>
        </LabCard>
        <LabCard title="Vague">
          <LabFormula>Words such as appropriate, adequate, reasonable, fast, secure resist objective verification</LabFormula>
          <div className="mt-3">
            <LabThresholds
              rows={[
                { range: "Unmeasurable", label: "No acceptance criteria", color: "bg-emerald-100 text-emerald-800" },
                { range: "Subjective", label: "Replace with measurable criteria", color: "bg-emerald-50 text-emerald-800" },
              ]}
            />
          </div>
        </LabCard>
      </div>
    </div>
  );
}

// ─── Self-review mode (one req at a time) ─────────────────────────────────────
function SelfReviewPanel() {
  const [index, setIndex] = useState(0);
  // Per-requirement student state
  const [pickedTags, setPickedTags] = useState<Record<number, Set<IssueTag>>>({});
  const [userNote, setUserNote] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const req = REQUIREMENTS[index];
  const id = req.id;
  const tags = pickedTags[id] ?? new Set<IssueTag>();
  const isRevealed = !!revealed[id];

  function toggleTag(tag: IssueTag) {
    if (isRevealed) return;
    setPickedTags((prev) => {
      const next = new Set(prev[id] ?? []);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return { ...prev, [id]: next };
    });
  }

  function reveal() {
    setRevealed((r) => ({ ...r, [id]: true }));
  }

  // Check which tags are correct/wrong
  const correctTags = new Set(req.issues);
  function tagResult(tag: IssueTag): "correct" | "missed" | "wrong" | "neutral" {
    const studentPicked = tags.has(tag);
    const shouldPick = correctTags.has(tag);
    if (!isRevealed) return "neutral";
    if (studentPicked && shouldPick) return "correct";
    if (!studentPicked && shouldPick) return "missed";
    if (studentPicked && !shouldPick) return "wrong";
    return "neutral";
  }

  const completedCount = Object.keys(revealed).length;

  return (
    <div className="space-y-4">
      <LabCard title="Self-Review Mode" icon={Eye}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="sm:w-40">
            <LabKpiCard
              label="Reviewed"
              value={`${completedCount}/${REQUIREMENTS.length}`}
              sub={`Req ${index + 1} of ${REQUIREMENTS.length}`}
              color="blue"
            />
          </div>
          <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${(completedCount / REQUIREMENTS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </LabCard>

      <LabCard title={`Requirement ${req.id}`}>
        <p className="text-sm font-medium leading-relaxed text-slate-800">{req.statement}</p>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-800">
              Step 1 — Select all issue tags that apply to this requirement:
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => {
                const result = tagResult(tag);
                let cls = OPTION_IDLE;
                if (!isRevealed && tags.has(tag)) {
                  cls = OPTION_SELECTED;
                } else if (result === "correct") {
                  cls = OPTION_CORRECT;
                } else if (result === "missed") {
                  cls = "border-amber-400 bg-amber-50 text-amber-800 font-semibold";
                } else if (result === "wrong") {
                  cls = OPTION_INCORRECT;
                }
                return (
                  <button
                    key={tag}
                    type="button"
                    disabled={isRevealed}
                    onClick={() => toggleTag(tag)}
                    className={cn("rounded-lg border px-3 py-1.5 text-xs transition-all", cls)}
                  >
                    {isRevealed && result === "correct" && <Check className="mr-1 inline h-3 w-3" />}
                    {isRevealed && result === "wrong" && <X className="mr-1 inline h-3 w-3" />}
                    {tag}
                  </button>
                );
              })}
            </div>
            {isRevealed && (
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Correct pick
                </span>
                <span className="flex items-center gap-1 text-amber-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> Missed
                </span>
                <span className="flex items-center gap-1 text-red-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-400" /> Incorrect pick
                </span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor={`note-${id}`} className="mb-1.5 block text-xs font-semibold text-slate-800">
              Step 2 — Briefly describe the clarification required for this requirement:
            </label>
            <textarea
              id={`note-${id}`}
              rows={3}
              value={userNote[id] ?? ""}
              onChange={(e) => setUserNote((n) => ({ ...n, [id]: e.target.value }))}
              disabled={isRevealed}
              placeholder="Write your clarification here in formal, third-person wording…"
              className={FIELD_CLASS}
            />
          </div>

          {!isRevealed && (
            <Button size="sm" onClick={reveal} disabled={tags.size === 0}>
              Reveal Reference Answer
            </Button>
          )}

          {isRevealed && (
            <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-800">Reference Answer</p>
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-800">Correct issue tags:</p>
                <div className="flex flex-wrap gap-1.5">
                  {req.issues.map((t) => (
                    <Badge key={t} variant={ISSUE_BADGE_VARIANT[t]}>
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-800">Identified ambiguity / issue:</p>
                <p className="text-[11px] leading-relaxed text-slate-600">{req.ambiguity}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-800">Clarification required:</p>
                <p className="text-[11px] leading-relaxed text-slate-600">{req.clarification}</p>
              </div>
            </div>
          )}
        </div>
      </LabCard>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <div className="flex gap-1">
          {REQUIREMENTS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index
                  ? "w-6 bg-blue-600"
                  : revealed[REQUIREMENTS[i].id]
                    ? "w-2 bg-emerald-400"
                    : "w-2 bg-slate-300",
              )}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" disabled={index === REQUIREMENTS.length - 1} onClick={() => setIndex((i) => i + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Editable analysis table ──────────────────────────────────────────────────
function AnalysisTable() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  // Per-row editable state
  const [edits, setEdits] = useState<Record<number, { ambiguity: string; clarification: string }>>({});
  const [showRef, setShowRef] = useState<Record<number, boolean>>({});

  const visible = activeFilter === "All"
    ? REQUIREMENTS
    : REQUIREMENTS.filter((r) => r.issues.includes(activeFilter as IssueTag));

  const counts = (["Ambiguous", "Incomplete", "Conflicting", "Vague"] as IssueTag[]).map((tag) => ({
    tag,
    count: REQUIREMENTS.filter((r) => r.issues.includes(tag)).length,
  }));

  return (
    <div className="space-y-4">
      <LabCard title="Analysis Table" icon={FileSearch}>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          The table below presents the 20 requirements for the student-attendance management
          application. Fill in the <strong className="text-slate-800">Identified Ambiguity</strong> and{" "}
          <strong className="text-slate-800">Clarification Required</strong> columns yourself, then click{" "}
          <strong className="text-slate-800">Show Reference</strong> to compare with the model answer.
        </p>
      </LabCard>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counts.map(({ tag, count }) => (
          <LabKpiCard
            key={tag}
            label={tag}
            value={count}
            color={tag === "Ambiguous" ? "amber" : tag === "Incomplete" ? "blue" : tag === "Conflicting" ? "red" : "green"}
          />
        ))}
      </div>

      <LabCard padded={false}>
        <div className="flex flex-wrap items-center gap-2 px-5 py-3">
          <Filter className="h-4 w-4 shrink-0 text-slate-500" />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              id={`filter-${opt.toLowerCase()}`}
              type="button"
              onClick={() => setActiveFilter(opt)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                activeFilter === opt ? OPTION_SELECTED : OPTION_IDLE,
              )}
            >
              {opt}
              {opt !== "All" && (
                <span className="ml-1 rounded-full bg-blue-100 px-1.5 text-[10px] text-blue-700">
                  {REQUIREMENTS.filter((r) => r.issues.includes(opt as IssueTag)).length}
                </span>
              )}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500">
            {visible.length} of {REQUIREMENTS.length} requirements
          </span>
        </div>
      </LabCard>

      <LabInfoBox title="Your task">
        Fill in the <em>Identified Ambiguity</em> and <em>Clarification Required</em> columns
        using formal third-person / passive wording. Click <strong>Show Reference</strong> on any row to compare with the model answer.
      </LabInfoBox>

      <LabCard padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="w-10 px-4 py-3 font-semibold">#</th>
                <th className="min-w-[200px] px-4 py-3 font-semibold">Requirement Statement</th>
                <th className="w-28 px-4 py-3 font-semibold">Tags</th>
                <th className="min-w-[220px] px-4 py-3 font-semibold">Identified Ambiguity or Issue <span className="text-blue-600">(your answer)</span></th>
                <th className="min-w-[220px] px-4 py-3 font-semibold">Clarification Required <span className="text-blue-600">(your answer)</span></th>
                <th className="w-28 px-4 py-3 font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((req) => {
                const edit = edits[req.id] ?? { ambiguity: "", clarification: "" };
                const refShown = !!showRef[req.id];
                return (
                  <>
                    <tr key={req.id} className="border-t border-slate-200 align-top hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 font-mono text-[11px] font-bold text-blue-700">
                          {req.id}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] leading-relaxed text-slate-800">{req.statement}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {req.issues.map((tag) => (
                            <Badge key={tag} variant={ISSUE_BADGE_VARIANT[tag]}>{tag}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          rows={3}
                          value={edit.ambiguity}
                          onChange={(e) => setEdits((prev) => ({ ...prev, [req.id]: { ...edit, ambiguity: e.target.value } }))}
                          placeholder="Describe the ambiguity or issue…"
                          className={FIELD_CLASS}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          rows={3}
                          value={edit.clarification}
                          onChange={(e) => setEdits((prev) => ({ ...prev, [req.id]: { ...edit, clarification: e.target.value } }))}
                          placeholder="State the clarification needed…"
                          className={FIELD_CLASS}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline"
                          onClick={() => setShowRef((s) => ({ ...s, [req.id]: !s[req.id] }))}
                          className="w-full text-[11px]">
                          {refShown ? "Hide" : "Show Reference"}
                        </Button>
                      </td>
                    </tr>
                    {refShown && (
                      <tr key={`ref-${req.id}`} className="border-t border-blue-100 bg-blue-50">
                        <td colSpan={2} className="px-4 py-2.5 text-[11px] font-semibold text-blue-700">Reference answer (R-{req.id})</td>
                        <td />
                        <td className="px-4 py-2.5 text-[11px] leading-relaxed text-slate-600">{req.ambiguity}</td>
                        <td className="px-4 py-2.5 text-[11px] leading-relaxed text-slate-600">{req.clarification}</td>
                        <td />
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </LabCard>

      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-800">Legend:</span>
        {(["Ambiguous", "Incomplete", "Conflicting", "Vague"] as IssueTag[]).map((tag) => (
          <span key={tag} className="flex items-center gap-1">
            <Badge variant={ISSUE_BADGE_VARIANT[tag]}>{tag}</Badge>
            {tag === "Ambiguous"   && "— multiple valid interpretations"}
            {tag === "Incomplete"  && "— missing preconditions / actors / error paths"}
            {tag === "Conflicting" && "— contradicts another requirement"}
            {tag === "Vague"       && "— unverifiable / unmeasurable language"}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Exercise Q&A ─────────────────────────────────────────────────────────────
interface ExerciseQ {
  id: number;
  text: string;
  type: "mcq" | "short";
  options?: string[];
  answer: string;
  explanation: string;
}

const EXQ: ExerciseQ[] = [
  {
    id: 1, type: "mcq",
    text: "Which requirement in the dataset contains a direct conflict with another requirement? Identify both requirements.",
    options: [
      "R-11 (data not shared with unauthorised parties) conflicts with R-14 (admin can export all student data).",
      "R-2 (login page) conflicts with R-7 (students view attendance).",
      "R-4 (notifications) conflicts with R-15 (automated reminders).",
      "R-8 (fast and responsive) conflicts with R-17 (available 24/7).",
    ],
    answer: "R-11 (data not shared with unauthorised parties) conflicts with R-14 (admin can export all student data).",
    explanation: "R-11 mandates data privacy, while R-14 permits full export of student data by the admin. Without an explicit role-based access-control model defining the admin as authorised, the two requirements directly contradict each other.",
  },
  {
    id: 2, type: "mcq",
    text: "The term 'should' in R-4 ('The system should send a notification…') introduces which type of issue?",
    options: [
      "Ambiguity — 'should' (RFC 2119) may mean optional, making it unclear whether this is a mandatory feature.",
      "Incompleteness — 'should' omits the actor responsible for sending.",
      "Conflict — 'should' contradicts R-15 which uses 'shall'.",
      "No issue — 'should' is acceptable in requirements documents.",
    ],
    answer: "Ambiguity — 'should' (RFC 2119) may mean optional, making it unclear whether this is a mandatory feature.",
    explanation: "Per RFC 2119 / IEEE 29148, 'shall' denotes a mandatory requirement while 'should' denotes a recommendation. Using 'should' when a mandatory feature is intended creates ambiguity about whether non-compliance is permissible.",
  },
  {
    id: 3, type: "mcq",
    text: "R-8 states 'The system should be fast and responsive.' What is the primary quality defect in this requirement?",
    options: [
      "Vague — 'fast' and 'responsive' are subjective and cannot be objectively verified or tested.",
      "Incomplete — the requirement omits the actor who must be fast.",
      "Conflicting — 'fast' and 'responsive' have different meanings.",
      "Ambiguous — the system could be interpreted as either the hardware or the software.",
    ],
    answer: "Vague — 'fast' and 'responsive' are subjective and cannot be objectively verified or tested.",
    explanation: "A non-functional requirement must include measurable acceptance criteria (e.g., latency percentile, concurrent user count). Without these, the requirement cannot be verified through testing — it is vague.",
  },
  {
    id: 4, type: "mcq",
    text: "R-19 says “The system shall maintain logs of all activities.” Which set is missing and makes the requirement incomplete?",
    options: [
      "Logged event types, retention period, and who may read the logs",
      "Only the programming language",
      "Only the Halstead volume",
      "A Cpk target",
    ],
    answer: "Logged event types, retention period, and who may read the logs",
    explanation:
      "Without scope, retention, and access control, testers cannot verify the logging shall.",
  },
  {
    id: 5, type: "mcq",
    text: "Which rewrite of R-8 is a verifiable non-functional requirement?",
    options: [
      "The system shall return the attendance-marking API within 500 ms at p99 under 300 concurrent users",
      "The system should feel fast",
      "The system shall be user-friendly",
      "The system should be responsive whenever possible",
    ],
    answer: "The system shall return the attendance-marking API within 500 ms at p99 under 300 concurrent users",
    explanation: "A time limit, percentile, and load make the statement testable.",
  },
  {
    id: 6, type: "mcq",
    text: "Which pair from the sample is primarily incomplete (missing window, statuses, or workflow details)?",
    options: [
      "R-3 (attendance marking) and R-16 (leave approval)",
      "R-2 (login page) and R-7 (view attendance)",
      "R-11 and R-14 only as a conflict, not incompleteness",
      "R-17 (24/7 availability) and R-2",
    ],
    answer: "R-3 (attendance marking) and R-16 (leave approval)",
    explanation:
      "R-3 omits the marking window and status values; R-16 omits the approval workflow and deadlines.",
  },
];

const CONCLUSION_QUIZ = [
  {
    id: "c1",
    prompt: "Per IEEE 29148 / RFC 2119, which word marks a mandatory requirement?",
    expected: "shall",
    explain: "'Shall' is mandatory. 'Should' is a recommendation and can make a requirement optional.",
    options: ["should", "shall", "may", "could"],
  },
  {
    id: "c2",
    prompt: "A requirement that cannot be tested because it uses words such as 'fast' is primarily:",
    expected: "Vague",
    explain: "Vague quantifiers lack measurable acceptance criteria.",
    options: ["Complete", "Traceable", "Vague", "Ranked"],
  },
  {
    id: "c3",
    prompt: "Two statements that cannot both be true at once are:",
    expected: "Conflicting",
    explain: "Conflicts are direct or indirect contradictions between requirements.",
    options: ["Incomplete", "Conflicting", "Modifiable", "Traced"],
  },
  {
    id: "c4",
    prompt: "Per RFC 2119, “should” in a requirement usually means:",
    expected: "A recommendation, not a strict mandate",
    explain: "Should/may are weaker than shall; they can be waived with justification.",
    options: [
      "The same as shall",
      "A recommendation, not a strict mandate",
      "A test verdict",
      "A function-point type",
    ],
  },
  {
    id: "c5",
    prompt: "An incomplete requirement typically:",
    expected: "Omits actors, data, or acceptance criteria needed to implement and test it",
    explain: "If testers cannot tell pass from fail, the statement is not ready.",
    options: [
      "Has a unique id and a measurable limit",
      "Omits actors, data, or acceptance criteria needed to implement and test it",
      "Is always a conflict",
      "Must use the word maybe",
    ],
  },
  {
    id: "c6",
    prompt: "A requirement is testable when:",
    expected: "You can state an observable pass/fail criterion",
    explain: "Measurable limits, roles, and conditions make verification possible.",
    options: [
      "It uses only adjectives such as user-friendly",
      "You can state an observable pass/fail criterion",
      "It has no identifier",
      "It contradicts another shall",
    ],
  },
  {
    id: "c7",
    prompt: "Traceability of a requirement means:",
    expected: "You can follow it to design, code, and test cases (and back)",
    explain: "Ids and links prevent orphan needs and orphan tests.",
    options: [
      "The text is written twice",
      "You can follow it to design, code, and test cases (and back)",
      "It contains no verbs",
      "It is stored only in email",
    ],
  },
  {
    id: "c8",
    prompt: "Ambiguous wording is dangerous because:",
    expected: "Different readers can implement or test different behaviours",
    explain: "Pronouns, undefined terms, and dual meanings create defects before coding starts.",
    options: [
      "It always increases Cpk",
      "Different readers can implement or test different behaviours",
      "IEEE requires ambiguity",
      "It only affects Halstead volume",
    ],
  },
  {
    id: "c9",
    prompt: "Ranking or prioritizing requirements helps when:",
    expected: "Schedule pressure forces a subset to be delivered first",
    explain: "MoSCoW or similar ranking keeps shall-must items ahead of nice-to-haves.",
    options: [
      "Every statement is equally optional",
      "Schedule pressure forces a subset to be delivered first",
      "You want to hide conflicts",
      "You are computing VAF",
    ],
  },
  {
    id: "c10",
    prompt: "A good repair for “the system shall be fast” is:",
    expected: "Replace it with a measurable limit (e.g. p95 response ≤ 2 s under N users)",
    explain: "Vague quality words become testable non-functionals when quantified.",
    options: [
      "Delete all performance needs",
      "Replace it with a measurable limit (e.g. p95 response ≤ 2 s under N users)",
      "Change shall to maybe",
      "Move the sentence to the quiz only",
    ],
  },
];

function ExercisePanel({ onDone }: { onDone: (done: boolean) => void }) {
  return (
    <div className="space-y-4">
      <LabCard title="Exercise" icon={ClipboardPen}>
        <p className="text-sm leading-relaxed text-slate-600">
          Answer from the attendance-app requirement sample. Use Try Yourself, Check Answer, and Show Explanation on each card.
        </p>
      </LabCard>
      <LabQuizCards
        questions={EXQ.map((q) => ({
          id: String(q.id),
          prompt: q.text,
          expected: q.answer,
          explain: q.explanation || q.answer,
          options: q.options,
        }))}
        onStatusChange={(s) => {
          if (s.allChecked) onDone(true);
        }}
      />
    </div>
  );
}

function ConclusionPanel({ exerciseDone }: { exerciseDone: boolean }) {
  const issueCounts = (["Ambiguous", "Incomplete", "Conflicting", "Vague"] as IssueTag[]).map((tag) => ({
    tag,
    count: REQUIREMENTS.filter((r) => r.issues.includes(tag)).length,
  }));
  return (
    <ConclusionQuizGate
      paragraphs={COPY.conclusion.body}
      questions={CONCLUSION_QUIZ}
      quizTitle="Experiment 7 — Conclusion quiz"
      locked={!exerciseDone}
      lockHint="Complete every question in the Exercise tab, then return here to take the quiz."
      originOptions={[
        { value: "sample", label: "Lab sample requirements" },
        { value: "own", label: "Own project" },
        { value: "github", label: "GitHub project" },
      ]}
      footnote="Requirement ambiguity analysis (Exercise 7)."
      studentSeed={{ title: "Requirement Ambiguity Analysis", origin: "sample" }}
      onDownload={async (s, result) => {
        const { downloadUnifiedLabPdf } = await import("@/lib/reportPdf");
        await downloadUnifiedLabPdf({
          experimentNumber: 7,
          experimentTitle: "Requirement Ambiguity Analysis",
          names: s.names,
          regs: s.regs,
          projectTitle: s.title,
          origin: s.origin,
          github: s.github,
          description: s.description,
          toolNote: "Structured review of 20 attendance-app requirements.",
          resultLines: issueCounts.map((row) => `${row.tag}: ${row.count}`),
          analysisLines: COPY.conclusion.body,
          conclusion: COPY.conclusion.body.join(" "),
          quizScore: result.score,
          quizTotal: result.total,
        });
      }}
    />
  );
}

// ─── Main shell ───────────────────────────────────────────────────────────────
export function Exp7Shell() {
  const [section, setSection] = useState<Exp7Section>("aim");
  const [exerciseDone, setExerciseDone] = useState(false);

  function renderBody() {
    if (section === "aim") return <ProseCard section="aim" />;
    if (section === "objective") {
      return (
        <LabCard title={COPY.objective.title} icon={Lightbulb}>
          <LabStepList items={COPY.objective.body} variant="objective" />
        </LabCard>
      );
    }
    if (section === "theory") return <TheoryPanel />;
    if (section === "procedure") {
      return (
        <LabCard title={COPY.procedure.title} icon={ClipboardList}>
          <div className="max-w-4xl space-y-3 text-sm leading-relaxed text-slate-600">
            {COPY.procedure.body.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
          </div>
        </LabCard>
      );
    }
    if (section === "selfreview") return <SelfReviewPanel />;
    if (section === "table") return <AnalysisTable />;
    if (section === "exercise") return <ExercisePanel onDone={setExerciseDone} />;
    return <ConclusionPanel exerciseDone={exerciseDone} />;
  }

  return (
    <LabPageShell
      experimentNumber={7}
      title="Requirement Ambiguity Analysis"
      subtitle="Review 20 student-attendance-app requirements, classify issues, write clarifications, and complete exercises on requirements quality."
      sections={SECTIONS}
      activeSection={section}
      onSectionChange={setSection}
    >
      {renderBody()}
    </LabPageShell>
  );
}
