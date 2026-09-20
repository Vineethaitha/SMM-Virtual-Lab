import type {
  AnalysisResult,
  CfgEdge,
  CfgNode,
  FunctionCfg,
  FunctionMetrics,
  HalsteadMetrics,
  Insight,
  LocMetrics,
  MetricExplanation,
  NodeType,
} from "@/lib/types";

export class SyntaxAnalysisError extends Error {
  lineno?: number;
  constructor(message: string, lineno?: number) {
    super(message);
    this.name = "SyntaxAnalysisError";
    this.lineno = lineno;
  }
}

type StmtKind =
  | "func"
  | "class"
  | "if"
  | "elif"
  | "else"
  | "for"
  | "while"
  | "try"
  | "except"
  | "finally"
  | "with"
  | "match"
  | "return"
  | "raise"
  | "break"
  | "continue"
  | "pass"
  | "other";

interface Stmt {
  kind: StmtKind;
  lineno: number;
  endLineno: number;
  text: string;
  name?: string;
  cond?: string;
  isAsync?: boolean;
  children: Stmt[];
}

const CC_HIGH = 10;
const CC_MODERATE = 6;
const NEST_HIGH = 3;

const OPERATORS = new Set([
  "+", "-", "*", "/", "//", "%", "**", "=", "==", "!=", "<", ">", "<=", ">=",
  "(", ")", "[", "]", "{", "}", ",", ":", ".", ";",
  "+=", "-=", "*=", "/=", "%=", "**=", "//=", "@", "->", "~", "&", "|", "^", "<<", ">>",
  "and", "or", "not", "in", "is", "if", "else", "elif", "for", "while", "return",
  "yield", "import", "from", "as", "def", "class", "try", "except", "finally", "with",
  "lambda", "await", "async", "assert", "raise", "pass", "break", "continue", "del",
]);

const MAX_SOURCE = 50_000;

export function analyzePython(source: string): AnalysisResult {
  if (!source.trim()) {
    throw new SyntaxAnalysisError("Source is empty", 1);
  }
  if (source.length > MAX_SOURCE) {
    throw new SyntaxAnalysisError(`Source exceeds ${MAX_SOURCE} characters`, 1);
  }
  const loc = rawMetrics(source);
  const root = parseModule(source);
  const functions = collectFunctions(root, null);
  const moduleH = halsteadFromSource(source);
  const totalCc = Math.max(1, functions.reduce((s, f) => s + f.metrics.cc, 0));
  const mi = maintainability(moduleH.volume, totalCc, loc.sloc, loc.comments, loc.loc);
  const cfgs = functions.map((fn) => buildCfg(fn.stmt));
  const insights = generateInsights(loc, functions.map((f) => f.metrics), moduleH, mi);
  return {
    language: "python",
    loc,
    functions: functions.map((f) => f.metrics),
    halstead: moduleH,
    maintainability: mi,
    cfgs,
    insights,
    explanations: explanations(),
  };
}

function rawMetrics(source: string): LocMetrics {
  const rawLines = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const loc = source.endsWith("\n") ? rawLines.length - 1 : rawLines.length;
  const lines = source.endsWith("\n") ? rawLines.slice(0, -1) : rawLines;
  let comments = 0;
  let blank = 0;
  let multi = 0;
  let inTriple: string | null = null;
  let tripleIsDoc = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (inTriple) {
      multi++;
      if (trimmed.includes(inTriple)) {
        const after = trimmed.split(inTriple).slice(1).join(inTriple);
        inTriple = after.includes(inTriple) ? inTriple : null;
        if (trimmed.endsWith('"""') || trimmed.endsWith("'''")) inTriple = null;
      }
      continue;
    }
    if (!trimmed) {
      blank++;
      continue;
    }
    const tripleMatch = trimmed.match(/^("""|''')/);
    if (tripleMatch) {
      const q = tripleMatch[1]!;
      const rest = trimmed.slice(3);
      const closed = rest.includes(q);
      if (!closed) {
        inTriple = q;
        tripleIsDoc = true;
        multi++;
      } else if (trimmed.startsWith(q) && countOcc(trimmed, q) >= 2 && !trimmed.slice(3, -3).includes(q) === false) {
        if (trimmed === `${q}${q}` || /^("""|''').*("""|''')/.test(trimmed)) multi++;
      }
      void tripleIsDoc;
      continue;
    }
    if (trimmed.startsWith("#")) {
      comments++;
      continue;
    }
  }
  const sloc = Math.max(0, loc - comments - blank - multi);
  const lloc = countLogicalLines(source);
  return {
    loc,
    lloc,
    sloc,
    comments,
    multi,
    blank,
    single_comments: comments,
  };
}

function countOcc(s: string, sub: string) {
  return s.split(sub).length - 1;
}

function countLogicalLines(source: string): number {
  let n = 0;
  let continued = false;
  for (const line of source.replace(/\r\n/g, "\n").split("\n")) {
    const t = stripComment(line).trim();
    if (!t) {
      continued = false;
      continue;
    }
    if (!continued) n++;
    continued = t.endsWith("\\") || t.endsWith(",") || t.endsWith("(") || t.endsWith("[") || t.endsWith("{");
  }
  return n;
}

function stripComment(line: string): string {
  let inS: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (inS) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === inS) inS = null;
      continue;
    }
    if (c === "'" || c === '"') {
      inS = c;
      continue;
    }
    if (c === "#") return line.slice(0, i);
  }
  return line;
}

function parseModule(source: string): Stmt[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const items: { indent: number; lineno: number; text: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const indent = raw.length - raw.trimStart().length;
    if (raw.includes("\t") && raw.includes(" ") && raw.trim()) {
      const lead = raw.slice(0, indent);
      if (lead.includes("\t") && lead.includes(" ")) {
        throw new SyntaxAnalysisError("inconsistent use of tabs and spaces in indentation", i + 1);
      }
    }
    items.push({ indent, lineno: i + 1, text: stripComment(raw).trim() });
  }
  const [tree] = parseBlock(items, 0, 0);
  return tree;
}

function parseBlock(
  items: { indent: number; lineno: number; text: string }[],
  start: number,
  indent: number,
): [Stmt[], number] {
  const out: Stmt[] = [];
  let i = start;
  while (i < items.length) {
    const item = items[i]!;
    if (item.indent < indent) break;
    if (item.indent > indent && out.length === 0) {
      throw new SyntaxAnalysisError("unexpected indent", item.lineno);
    }
    if (item.indent > indent) break;
    const [stmt, next] = parseStmt(items, i);
    out.push(stmt);
    i = next;
  }
  return [out, i];
}

function parseStmt(
  items: { indent: number; lineno: number; text: string }[],
  i: number,
): [Stmt, number] {
  const item = items[i]!;
  const text = item.text;
  const header = classify(text);
  if (header.opens) {
    const childIndent = i + 1 < items.length && items[i + 1]!.indent > item.indent ? items[i + 1]!.indent : item.indent + 4;
    const [children, next] = parseBlock(items, i + 1, childIndent);
    const end = children.length ? children[children.length - 1]!.endLineno : item.lineno;
    return [
      {
        kind: header.kind,
        lineno: item.lineno,
        endLineno: end,
        text,
        name: header.name,
        cond: header.cond,
        isAsync: header.isAsync,
        children,
      },
      next,
    ];
  }
  return [
    {
      kind: header.kind,
      lineno: item.lineno,
      endLineno: item.lineno,
      text,
      name: header.name,
      cond: header.cond,
      children: [],
    },
    i + 1,
  ];
}

function classify(text: string): {
  kind: StmtKind;
  opens: boolean;
  name?: string;
  cond?: string;
  isAsync?: boolean;
} {
  const t = text.replace(/\\\s*$/, "").trim();
  const asyncDef = t.match(/^async\s+def\s+([A-Za-z_][\w]*)\s*\(/);
  if (asyncDef) return { kind: "func", opens: t.endsWith(":"), name: asyncDef[1], isAsync: true };
  const defm = t.match(/^def\s+([A-Za-z_][\w]*)\s*\(/);
  if (defm) return { kind: "func", opens: t.endsWith(":"), name: defm[1] };
  const clsm = t.match(/^class\s+([A-Za-z_][\w]*)/);
  if (clsm) return { kind: "class", opens: t.endsWith(":"), name: clsm[1] };
  if (/^elif\b/.test(t)) return { kind: "elif", opens: t.endsWith(":"), cond: t.replace(/^elif\s+/, "").replace(/:\s*$/, "") };
  if (/^else\s*:/.test(t)) return { kind: "else", opens: true };
  if (/^if\b/.test(t)) return { kind: "if", opens: t.endsWith(":"), cond: t.replace(/^if\s+/, "").replace(/:\s*$/, "") };
  if (/^for\b/.test(t)) return { kind: "for", opens: t.endsWith(":"), cond: t.replace(/^for\s+/, "").replace(/:\s*$/, "") };
  if (/^while\b/.test(t)) return { kind: "while", opens: t.endsWith(":"), cond: t.replace(/^while\s+/, "").replace(/:\s*$/, "") };
  if (/^try\s*:/.test(t)) return { kind: "try", opens: true };
  if (/^except\b/.test(t)) return { kind: "except", opens: t.endsWith(":") };
  if (/^finally\s*:/.test(t)) return { kind: "finally", opens: true };
  if (/^with\b/.test(t)) return { kind: "with", opens: t.endsWith(":") };
  if (/^match\b/.test(t)) return { kind: "match", opens: t.endsWith(":"), cond: t.replace(/^match\s+/, "").replace(/:\s*$/, "") };
  if (/^return\b/.test(t)) return { kind: "return" as const, opens: false };
  if (/^raise\b/.test(t)) return { kind: "raise" as const, opens: false };
  if (/^break\b/.test(t)) return { kind: "break" as const, opens: false };
  if (/^continue\b/.test(t)) return { kind: "continue" as const, opens: false };
  if (/^pass\b/.test(t)) return { kind: "pass" as const, opens: false };
  return { kind: "other", opens: t.endsWith(":") };
}

function collectFunctions(
  stmts: Stmt[],
  classname: string | null,
): { stmt: Stmt; metrics: FunctionMetrics }[] {
  const out: { stmt: Stmt; metrics: FunctionMetrics }[] = [];
  for (const stmt of stmts) {
    if (stmt.kind === "class") {
      out.push(...collectFunctions(stmt.children, stmt.name ?? null));
      continue;
    }
    if (stmt.kind === "func" && stmt.name) {
      const cc = cyclomatic(stmt.children);
      const depth = decisionDepth(stmt.children);
      const rank = ccRank(cc);
      const qname = classname ? `${classname}.${stmt.name}` : stmt.name;
      const bodyH = halsteadFromText(flattenText(stmt));
      out.push({
        stmt,
        metrics: {
          name: stmt.name,
          qualified_name: qname,
          lineno: stmt.lineno,
          end_lineno: stmt.endLineno,
          col_offset: 0,
          is_method: Boolean(classname),
          classname,
          cc,
          rank,
          loc: Math.max(stmt.endLineno - stmt.lineno + 1, 1),
          nested_decision_depth: depth,
          is_complex: cc >= 10 || depth >= 3 || ["C", "D", "E", "F"].includes(rank),
          halstead: bodyH,
        },
      });
      out.push(...collectFunctions(stmt.children, classname));
    } else {
      out.push(...collectFunctions(stmt.children, classname));
    }
  }
  return out;
}

function flattenText(stmt: Stmt): string {
  return [stmt.text, ...stmt.children.map(flattenText)].join("\n");
}

function cyclomatic(body: Stmt[]): number {
  let cc = 1;
  const walk = (stmts: Stmt[]) => {
    for (const s of stmts) {
      if (s.kind === "if" || s.kind === "elif" || s.kind === "for" || s.kind === "while" || s.kind === "except" || s.kind === "with" || s.kind === "match") {
        cc += 1;
      }
      if (s.cond) cc += boolExtras(s.cond);
      if (/\bassert\b/.test(s.text)) cc += 1;
      if (s.kind !== "func" && s.kind !== "class") walk(s.children);
    }
  };
  walk(body);
  return cc;
}

function boolExtras(cond: string): number {
  const parts = cond.split(/\b(and|or)\b/);
  return Math.max(0, Math.floor((parts.length - 1) / 2));
}

function decisionDepth(body: Stmt[], current = 0): number {
  let maxD = current;
  for (const s of body) {
    if (s.kind === "if" || s.kind === "elif" || s.kind === "for" || s.kind === "while") {
      maxD = Math.max(maxD, current + 1);
      maxD = Math.max(maxD, decisionDepth(s.children, current + 1));
    } else if (s.kind === "except") {
      maxD = Math.max(maxD, current + 1);
      maxD = Math.max(maxD, decisionDepth(s.children, current + 1));
    } else if (s.kind !== "func" && s.kind !== "class") {
      maxD = Math.max(maxD, decisionDepth(s.children, current));
    }
  }
  return maxD;
}

function ccRank(cc: number): string {
  if (cc <= 5) return "A";
  if (cc <= 10) return "B";
  if (cc <= 20) return "C";
  if (cc <= 30) return "D";
  if (cc <= 40) return "E";
  return "F";
}

function miRank(mi: number): string {
  if (mi > 19) return "A";
  if (mi >= 10) return "B";
  return "C";
}

function emptyHalstead(): HalsteadMetrics {
  return {
    h1: 0, h2: 0, n1: 0, n2: 0, vocabulary: 0, length: 0, calculated_length: 0,
    volume: 0, difficulty: 0, effort: 0, time: 0, bugs: 0,
  };
}

function finalizeHalstead(ops: string[], operands: string[]): HalsteadMetrics {
  const uniqOps = new Set(ops);
  const uniqOperands = new Set(operands);
  const h1 = uniqOps.size;
  const h2 = uniqOperands.size;
  const n1 = ops.length;
  const n2 = operands.length;
  const vocabulary = h1 + h2;
  const length = n1 + n2;
  const calculated_length = h1 && h2 ? h1 * Math.log2(h1) + h2 * Math.log2(h2) : 0;
  const volume = vocabulary > 0 ? length * Math.log2(vocabulary) : 0;
  const difficulty = h2 > 0 ? (h1 / 2) * (n2 / h2) : 0;
  const effort = difficulty * volume;
  const time = effort / 18;
  const bugs = volume / 3000;
  return { h1, h2, n1, n2, vocabulary, length, calculated_length, volume, difficulty, effort, time, bugs };
}

function tokenizeCode(source: string): { ops: string[]; operands: string[] } {
  const ops: string[] = [];
  const operands: string[] = [];
  const s = source.replace(/\r\n/g, "\n");
  let i = 0;
  const two = ["==", "!=", "<=", ">=", "**", "//", "+=", "-=", "*=", "/=", "%=", "->", "<<", ">>"];
  while (i < s.length) {
    const c = s[i]!;
    if (c === "#" && (i === 0 || s[i - 1] !== '"')) {
      while (i < s.length && s[i] !== "\n") i++;
      continue;
    }
    if (s.startsWith('"""', i) || s.startsWith("'''", i)) {
      const q = s.slice(i, i + 3);
      const end = s.indexOf(q, i + 3);
      const lit = end < 0 ? s.slice(i) : s.slice(i, end + 3);
      operands.push(lit);
      i = end < 0 ? s.length : end + 3;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < s.length && s[j] !== c) {
        if (s[j] === "\\") j += 2;
        else j++;
      }
      operands.push(s.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[\w]/.test(s[j]!)) j++;
      const word = s.slice(i, j);
      if (OPERATORS.has(word)) ops.push(word);
      else operands.push(word);
      i = j;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[0-9_.]/.test(s[j]!)) j++;
      operands.push(s.slice(i, j));
      i = j;
      continue;
    }
    const pair = s.slice(i, i + 2);
    if (two.includes(pair)) {
      ops.push(pair);
      i += 2;
      continue;
    }
    if (OPERATORS.has(c)) ops.push(c);
    i++;
  }
  return { ops, operands };
}

function halsteadFromSource(source: string): HalsteadMetrics {
  const { ops, operands } = tokenizeCode(source);
  if (!ops.length && !operands.length) return emptyHalstead();
  return finalizeHalstead(ops, operands);
}

function halsteadFromText(text: string): HalsteadMetrics {
  return halsteadFromSource(text);
}

function maintainability(volume: number, cc: number, sloc: number, _comments: number, _loc: number) {
  const v = Math.max(volume, 1);
  const s = Math.max(sloc, 1);
  const raw = (171 - 5.2 * Math.log(v) - 0.23 * cc - 16.2 * Math.log(s)) * 100 / 171;
  const mi = Math.round(Math.max(0, raw) * 100) / 100;
  return { mi, rank: miRank(mi) };
}

function buildCfg(fn: Stmt): FunctionCfg {
  const nodes: CfgNode[] = [];
  const edges: CfgEdge[] = [];
  let seq = 0;
  const nid = () => `${fn.name ?? "fn"}_${++seq}`;
  const addNode = (
    type: NodeType,
    label: string,
    lineno: number,
    end: number,
    condition: string | null = null,
  ): CfgNode => {
    const node: CfgNode = {
      id: nid(),
      type,
      label: label.slice(0, 80),
      lineno,
      end_lineno: end,
      function: fn.name ?? "fn",
      condition,
    };
    nodes.push(node);
    return node;
  };
  const addEdge = (source: string, target: string, label: CfgEdge["label"] = null) => {
    if (!source || !target || source === target) return;
    edges.push({
      id: `e${edges.length + 1}_${source}_${target}_${label ?? "seq"}`,
      source,
      target,
      label,
    });
  };

  const entry = addNode("entry", "ENTRY", fn.lineno, fn.lineno);
  const exitN = addNode("exit", "EXIT", fn.endLineno, fn.endLineno);
  const sequence = (stmts: Stmt[], after: string): string => {
    if (!stmts.length) return after;
    const stmt = stmts[0]!;
    const rest = stmts.slice(1);
    if (stmt.kind === "return" || stmt.kind === "raise") {
      const node = addNode("return", stmt.text, stmt.lineno, stmt.endLineno);
      addEdge(node.id, exitN.id);
      return node.id;
    }
    if (stmt.kind === "break" || stmt.kind === "continue") {
      const node = addNode("block", stmt.text, stmt.lineno, stmt.endLineno);
      addEdge(node.id, after);
      return node.id;
    }
    if (stmt.kind === "if") {
      const afterRest = sequence(rest, after);
      const elseChild = stmt.children.find((c) => c.kind === "else");
      const trueBody = stmt.children.filter((c) => c.kind !== "else");
      const decision = addNode("decision", stmt.text, stmt.lineno, stmt.lineno, stmt.cond ?? stmt.text);
      addEdge(decision.id, sequence(trueBody, afterRest), "true");
      addEdge(decision.id, elseChild ? sequence(elseChild.children, afterRest) : afterRest, "false");
      return decision.id;
    }
    if (stmt.kind === "for" || stmt.kind === "while") {
      const afterRest = sequence(rest, after);
      const loop = addNode("loop", stmt.text, stmt.lineno, stmt.lineno, stmt.cond ?? stmt.text);
      const before = edges.length;
      const body = sequence(stmt.children, loop.id);
      for (const e of edges.slice(before)) {
        if (e.target === loop.id && e.label == null) e.label = "back";
      }
      addEdge(loop.id, body, "true");
      addEdge(loop.id, afterRest, "false");
      return loop.id;
    }
    if (stmt.kind === "try") {
      return sequence([...stmt.children, ...rest], after);
    }
    if (stmt.kind === "func" || stmt.kind === "class" || stmt.kind === "else" || stmt.kind === "except" || stmt.kind === "finally") {
      return sequence([...stmt.children, ...rest], after);
    }
    const blockStmts = [stmt];
    let j = 0;
    while (
      j < rest.length &&
      !["if", "elif", "for", "while", "try", "match", "return", "raise", "break", "continue"].includes(rest[j]!.kind)
    ) {
      blockStmts.push(rest[j]!);
      j++;
    }
    const leftover = rest.slice(j);
    if (leftover[0] && (leftover[0].kind === "return" || leftover[0].kind === "raise")) {
      blockStmts.push(leftover[0]);
      const node = addNode("return", blockStmts.map((s) => s.text).join("\n"), blockStmts[0]!.lineno, blockStmts[blockStmts.length - 1]!.endLineno);
      addEdge(node.id, exitN.id);
      return node.id;
    }
    const node = addNode("block", blockStmts.map((s) => s.text).join("\n"), blockStmts[0]!.lineno, blockStmts[blockStmts.length - 1]!.endLineno);
    addEdge(node.id, sequence(leftover, after));
    return node.id;
  };

  const chained = foldElif(fn.children);
  addEdge(entry.id, sequence(chained, exitN.id));
  const seen = new Set<string>();
  const deduped: CfgEdge[] = [];
  for (const e of edges) {
    const key = `${e.source}|${e.target}|${e.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(e);
  }
  return { function: fn.name ?? "fn", nodes, edges: deduped };
}

function foldElif(stmts: Stmt[]): Stmt[] {
  const out: Stmt[] = [];
  let i = 0;
  while (i < stmts.length) {
    const s = stmts[i]!;
    if (s.kind === "if") {
      const chain: Stmt[] = [s];
      i += 1;
      while (i < stmts.length && (stmts[i]!.kind === "elif" || stmts[i]!.kind === "else")) {
        chain.push(stmts[i]!);
        i += 1;
      }
      out.push(nestIfChain(chain));
      continue;
    }
    out.push({ ...s, children: foldElif(s.children) });
    i += 1;
  }
  return out;
}

function nestIfChain(chain: Stmt[]): Stmt {
  const head = chain[0]!;
  const rest = chain.slice(1);
  const trueChildren = foldElif(head.children);
  if (!rest.length) return { ...head, kind: "if", children: trueChildren };
  const first = rest[0]!;
  if (first.kind === "else") {
    return {
      ...head,
      kind: "if",
      children: [
        ...trueChildren,
        {
          kind: "else",
          lineno: first.lineno,
          endLineno: first.endLineno,
          text: "else",
          children: foldElif(first.children),
        },
      ],
    };
  }
  const nested = nestIfChain([
    { ...first, kind: "if", text: `if ${first.cond ?? ""}`.trim(), cond: first.cond },
    ...rest.slice(1),
  ]);
  return {
    ...head,
    kind: "if",
    children: [
      ...trueChildren,
      {
        kind: "else",
        lineno: first.lineno,
        endLineno: nested.endLineno,
        text: "else",
        children: [nested],
      },
    ],
  };
}

function explanations(): MetricExplanation[] {
  return [
    {
      family: "loc",
      title: "Lines of Code (LOC family)",
      what: "LOC counts physical lines. SLOC is source lines (no blanks/comments). LLOC counts logical statements. Comments and blanks describe documentation density.",
      how: "The browser analyzer scans the buffer: LOC = all lines; SLOC = non-blank non-comment source; LLOC = statements. Code is never executed.",
      meaning: "High LOC is not automatically bad, but large functions are harder to test. Prefer splitting work when SLOC grows while cyclomatic complexity also rises.",
    },
    {
      family: "cyclomatic",
      title: "Cyclomatic Complexity (McCabe)",
      what: "Cyclomatic complexity M is the number of independent execution paths. Each decision (if, elif, for, while, except, and/or) adds a path.",
      how: "McCabe: M = E − N + 2P. This lab counts predicates in a static parse of the buffer (equivalent for structured Python).",
      meaning: "Ranks A (1–5) simple, B (6–10) moderate, C–F increasingly risky. Functions ranked C or worse are prime refactoring targets.",
    },
    {
      family: "halstead",
      title: "Halstead Metrics",
      what: "Halstead treats code as operators and operands. Vocabulary η = η1 + η2, length N = N1 + N2, volume V = N log2(η), difficulty D = (η1/2)×(N2/η2), effort E = D × V.",
      how: "Tokens are classified as operators or operands, then the closed-form formulas are applied. Nothing is executed.",
      meaning: "Volume estimates information content; difficulty and effort estimate how hard the code is to write or review. Nested conditions inflate operators and effort.",
    },
    {
      family: "maintainability",
      title: "Maintainability Index (MI)",
      what: "MI is a 0–100 composite of Halstead volume, cyclomatic complexity, and SLOC. Higher is easier to maintain.",
      how: "MI = max(0, (171 − 5.2 ln(V) − 0.23 CC − 16.2 ln(SLOC)) × 100 / 171). Rank A ≥20, B 10–19, C 0–9.",
      meaning: "A falling MI after a change signals the module got harder to maintain. Improving MI after a refactor is evidence the change helped.",
    },
  ];
}

function generateInsights(
  loc: LocMetrics,
  functions: FunctionMetrics[],
  halstead: HalsteadMetrics,
  maintainability: { mi: number; rank: string },
): Insight[] {
  const insights: Insight[] = [];
  const complexFns = functions.filter((f) => f.is_complex);
  if (complexFns.length) {
    for (const fn of [...complexFns].sort((a, b) => b.cc - a.cc)) {
      insights.push({
        severity: fn.cc >= CC_HIGH ? "critical" : "warning",
        title: `Function ${fn.name} has high complexity.`,
        detail: `${fn.qualified_name} has cyclomatic complexity ${fn.cc} (rank ${fn.rank}) and nested decision depth ${fn.nested_decision_depth}. Consider simplifying conditions or extracting logic.`,
        function: fn.name,
        lineno: fn.lineno,
      });
    }
  } else {
    insights.push({
      severity: "info",
      title: "No high-complexity functions detected.",
      detail: "All functions are at or below the moderate McCabe threshold (CC < 10).",
      function: null,
      lineno: null,
    });
  }
  const nested = functions.filter((f) => f.nested_decision_depth >= NEST_HIGH);
  if (nested.length) {
    insights.push({
      severity: "warning",
      title: "Nested decisions increase execution paths.",
      detail: `${nested.map((f) => f.name).join(", ")} nest decisions ${NEST_HIGH}+ levels deep. Each extra predicate multiplies independent paths (McCabe) and makes tests harder to enumerate.`,
      function: nested[0]!.name,
      lineno: nested[0]!.lineno,
    });
  }
  if (functions.length) {
    const maxCc = Math.max(...functions.map((f) => f.cc));
    if (loc.sloc > 0 && maxCc >= CC_MODERATE && loc.sloc / Math.max(functions.length, 1) < 8) {
      insights.push({
        severity: "info",
        title: "Complexity is driven by decisions, not size.",
        detail: "SLOC is modest relative to cyclomatic complexity. Refactoring conditions (guard clauses, lookup tables, extracted predicates) will help more than deleting lines.",
        function: null,
        lineno: null,
      });
    }
  }
  if (halstead.effort > 2000) {
    insights.push({
      severity: "warning",
      title: "Halstead effort is elevated.",
      detail: `Effort E = ${halstead.effort.toFixed(1)} (difficulty ${halstead.difficulty.toFixed(2)} × volume ${halstead.volume.toFixed(1)}). Unique operators and operand reuse make the module mentally expensive. Extract helpers to shrink vocabulary.`,
      function: null,
      lineno: null,
    });
  } else if (halstead.volume > 0) {
    insights.push({
      severity: "info",
      title: "Halstead volume reflects information content.",
      detail: `Volume V = ${halstead.volume.toFixed(1)} with vocabulary η = ${halstead.vocabulary.toFixed(0)}. Compare volume after a refactor: a drop usually means simpler expressions.`,
      function: null,
      lineno: null,
    });
  }
  if (maintainability.rank === "B" || maintainability.rank === "C") {
    insights.push({
      severity: maintainability.rank === "C" ? "warning" : "info",
      title: "Maintainability Index has room to improve.",
      detail: `MI is ${maintainability.mi} (rank ${maintainability.rank}). Reducing CC and SLOC while keeping useful comments typically raises MI.`,
      function: null,
      lineno: null,
    });
  } else {
    insights.push({
      severity: "info",
      title: "Maintainability Index is in a healthy band.",
      detail: `MI is ${maintainability.mi} (rank ${maintainability.rank}) on the 0–100 scale.`,
      function: null,
      lineno: null,
    });
  }
  insights.push({
    severity: "info",
    title: "Consider simplifying conditions or extracting logic.",
    detail: "Replace nested if/elif chains with early returns, helper predicates, or data-driven maps. Re-analyze and compare cyclomatic complexity, Halstead effort, and MI.",
    function: null,
    lineno: null,
  });
  return insights;
}
