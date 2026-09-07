// ================================================================
// Experiment 5 — Object-Oriented Design Metrics
// All identifiers prefixed exp5_ for full isolation
// ================================================================

// ─── Types ───────────────────────────────────────────────────────

export interface Exp5ClassDef {
  id: string;
  name: string;
  attributes: string[];
  methods: string[];
}

export interface Exp5Relationship {
  from: string;
  to: string;
  type: "generalization" | "association";
}

export interface Exp5CohesionEntry {
  classId: string;
  level: "High" | "Medium" | "Low";
  reason: string;
}

export interface Exp5ClassMetrics {
  id: string;
  name: string;
  attributeCount: number;
  methodCount: number;
  totalMembers: number;
  sizeCategory: "Small" | "Medium" | "Large";
  cohesionLevel: "High" | "Medium" | "Low";
  cohesionReason: string;
  outgoing: number;
  incoming: number;
  couplingCategory: "Low" | "Medium" | "High";
  estimatedResponseSet: number;
  responseReason: string;
}

export type Exp5Tab =
  | "aim"
  | "objective"
  | "theory"
  | "procedure"
  | "exercise"
  | "simulation"
  | "results"
  | "analysis"
  | "comparison"
  | "conclusion";

export const EXP5_TABS: { id: Exp5Tab; label: string }[] = [
  { id: "aim", label: "Aim" },
  { id: "objective", label: "Objective" },
  { id: "theory", label: "Theory" },
  { id: "procedure", label: "Procedure" },
  { id: "exercise", label: "Exercise" },
  { id: "simulation", label: "Simulation" },
  { id: "results", label: "Results" },
  { id: "analysis", label: "Analysis" },
  { id: "comparison", label: "Comparison" },
  { id: "conclusion", label: "Conclusion" },
];

// ─── Class Definitions ───────────────────────────────────────────

export const EXP5_CLASSES: Exp5ClassDef[] = [
  {
    id: "User",
    name: "User",
    attributes: ["userId", "name", "email"],
    methods: ["login()", "logout()", "updateProfile()"],
  },
  {
    id: "Admin",
    name: "Admin",
    attributes: [],
    methods: ["addProduct()", "removeProduct()", "viewReports()"],
  },
  {
    id: "Guest",
    name: "Guest",
    attributes: [],
    methods: ["browseProducts()", "register()"],
  },
  {
    id: "Product",
    name: "Product",
    attributes: ["productId", "name", "price", "stock"],
    methods: ["updateStock()", "applyDiscount()", "getDetails()"],
  },
  {
    id: "Order",
    name: "Order",
    attributes: ["orderId", "cart", "status", "payment"],
    methods: ["placeOrder()", "cancelOrder()", "trackOrder()"],
  },
  {
    id: "ShoppingCart",
    name: "ShoppingCart",
    attributes: ["cartId", "user", "products[]"],
    methods: ["addProduct()", "removeProduct()", "calculateTotal()", "checkout()"],
  },
  {
    id: "Invoice",
    name: "Invoice",
    attributes: ["invoiceId", "order"],
    methods: ["generateInvoice()", "sendInvoice()"],
  },
  {
    id: "DatabaseConnector",
    name: "DatabaseConnector",
    attributes: ["connectionString"],
    methods: ["connect()"],
  },
  {
    id: "NotificationService",
    name: "NotificationService",
    attributes: [],
    methods: ["sendNotification(message)"],
  },
  {
    id: "EmailService",
    name: "EmailService",
    attributes: [],
    methods: ["sendNotification(message)"],
  },
  {
    id: "SMSService",
    name: "SMSService",
    attributes: [],
    methods: ["sendNotification(message)"],
  },
];

// ─── Relationships ───────────────────────────────────────────────

export const EXP5_RELATIONSHIPS: Exp5Relationship[] = [
  { from: "User", to: "Admin", type: "generalization" },
  { from: "User", to: "Guest", type: "generalization" },
  { from: "Admin", to: "Product", type: "association" },
  { from: "Guest", to: "Order", type: "association" },
  { from: "Order", to: "ShoppingCart", type: "association" },
  { from: "ShoppingCart", to: "Invoice", type: "association" },
  { from: "ShoppingCart", to: "NotificationService", type: "association" },
  { from: "Invoice", to: "DatabaseConnector", type: "association" },
  { from: "NotificationService", to: "EmailService", type: "association" },
  { from: "NotificationService", to: "SMSService", type: "association" },
  { from: "Invoice", to: "EmailService", type: "association" },
];

// ─── Cohesion Assessments ────────────────────────────────────────

export const EXP5_COHESION: Exp5CohesionEntry[] = [
  {
    classId: "User",
    level: "High",
    reason: "Focused on user identity, authentication, and profile management.",
  },
  {
    classId: "Admin",
    level: "Medium",
    reason:
      "Combines product management (addProduct, removeProduct) and reporting (viewReports) — two distinct administrative responsibilities.",
  },
  {
    classId: "Guest",
    level: "High",
    reason: "Focused on the guest user journey: browsing products and initiating registration.",
  },
  {
    classId: "Product",
    level: "High",
    reason: "Focused on product data (attributes) and product-specific operations.",
  },
  {
    classId: "Order",
    level: "High",
    reason: "Focused on the order lifecycle: placement, cancellation, and tracking.",
  },
  {
    classId: "ShoppingCart",
    level: "High",
    reason: "Focused on cart operations: managing items, calculating totals, and checkout.",
  },
  {
    classId: "Invoice",
    level: "High",
    reason: "Focused on invoice creation and delivery.",
  },
  {
    classId: "DatabaseConnector",
    level: "High",
    reason: "Focused solely on database connectivity.",
  },
  {
    classId: "NotificationService",
    level: "High",
    reason: "Focused on notification dispatching to concrete notification channels.",
  },
  {
    classId: "EmailService",
    level: "High",
    reason: "Focused solely on email delivery.",
  },
  {
    classId: "SMSService",
    level: "High",
    reason: "Focused solely on SMS delivery.",
  },
];

// ─── Metric Helpers ──────────────────────────────────────────────

export function exp5_getSizeCategory(total: number): "Small" | "Medium" | "Large" {
  if (total <= 4) return "Small";
  if (total <= 7) return "Medium";
  return "Large";
}

export function exp5_getCouplingCategory(outgoing: number): "Low" | "Medium" | "High" {
  if (outgoing <= 1) return "Low";
  if (outgoing <= 3) return "Medium";
  return "High";
}

export function exp5_computeAllMetrics(
  classes: Exp5ClassDef[],
  rels: Exp5Relationship[],
  cohesion: Exp5CohesionEntry[],
): Exp5ClassMetrics[] {
  return classes.map((cls) => {
    const attrCount = cls.attributes.length;
    const methCount = cls.methods.length;
    const total = attrCount + methCount;
    const outgoing = rels.filter((r) => r.from === cls.id).length;
    const incoming = rels.filter((r) => r.to === cls.id).length;

    // Estimated Response Set = own methods + methods of directly interacted classes
    const targetIds = rels.filter((r) => r.from === cls.id).map((r) => r.to);
    const targetMethodCount = targetIds.reduce((acc, tid) => {
      const t = classes.find((c) => c.id === tid);
      return acc + (t?.methods.length ?? 0);
    }, 0);
    const ers = methCount + targetMethodCount;

    const targetNames = targetIds.map((tid) => classes.find((c) => c.id === tid)?.name ?? tid);
    const responseReason =
      targetIds.length === 0
        ? `${methCount} own method${methCount !== 1 ? "s" : ""}, no direct interactions.`
        : `${methCount} own method${methCount !== 1 ? "s" : ""} + ${targetMethodCount} method${targetMethodCount !== 1 ? "s" : ""} from ${targetNames.join(", ")}.`;

    const coh = cohesion.find((c) => c.classId === cls.id);

    return {
      id: cls.id,
      name: cls.name,
      attributeCount: attrCount,
      methodCount: methCount,
      totalMembers: total,
      sizeCategory: exp5_getSizeCategory(total),
      cohesionLevel: coh?.level ?? "High",
      cohesionReason: coh?.reason ?? "",
      outgoing,
      incoming,
      couplingCategory: exp5_getCouplingCategory(outgoing),
      estimatedResponseSet: ers,
      responseReason,
    };
  });
}

// ─── Quiz ────────────────────────────────────────────────────────

export interface Exp5QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number; // 0-indexed
  feedback: string;
}

export const EXP5_QUIZ: Exp5QuizQuestion[] = [
  {
    id: 1,
    question: "Which characteristic generally indicates a larger class?",
    options: [
      "More attributes and methods",
      "Fewer attributes and methods",
      "No relationships with other classes",
      "Only one method",
    ],
    correct: 0,
    feedback:
      "Class size is measured by the total number of attributes and methods. More members indicate a larger class with more contained functionality.",
  },
  {
    id: 2,
    question: "What does high cohesion mean?",
    options: [
      "The responsibilities of a class are closely related",
      "A class depends on every other class",
      "A class has many unrelated responsibilities",
      "A class has no methods",
    ],
    correct: 0,
    feedback:
      "High cohesion means that the methods and attributes of a class work together toward a single, focused responsibility, making the class easier to understand and maintain.",
  },
  {
    id: 3,
    question: "Which class has a focused database-connection responsibility?",
    options: ["DatabaseConnector", "Admin", "Guest", "ShoppingCart"],
    correct: 0,
    feedback:
      "DatabaseConnector contains only a connectionString attribute and a connect() method, making its single responsibility — database connectivity — very clear.",
  },
  {
    id: 4,
    question: "Which situation represents high coupling?",
    options: [
      "A class has many direct dependencies on other classes",
      "A class has one focused responsibility",
      "A class has no dependencies",
      "A class contains only data attributes",
    ],
    correct: 0,
    feedback:
      "High coupling occurs when a class has many direct dependencies on other classes, making it more difficult to change, test, or reuse independently.",
  },
  {
    id: 5,
    question:
      "Which class contains methods for adding/removing products and calculating the cart total?",
    options: ["ShoppingCart", "DatabaseConnector", "Guest", "SMSService"],
    correct: 0,
    feedback:
      "ShoppingCart contains addProduct(), removeProduct(), calculateTotal(), and checkout() — all focused on cart management operations.",
  },
  {
    id: 6,
    question:
      "Which strategy can help reduce direct dependency on concrete notification services?",
    options: [
      "Introduce an interface",
      "Add more direct dependencies",
      "Merge every service into one class",
      "Duplicate every notification method",
    ],
    correct: 0,
    feedback:
      "Introducing an interface (e.g., a NotificationInterface) allows NotificationService to depend on an abstraction rather than directly on EmailService and SMSService, reducing coupling.",
  },
  {
    id: 7,
    question: "Which class contains: addProduct(), removeProduct(), viewReports()?",
    options: ["Admin", "Guest", "Product", "Order"],
    correct: 0,
    feedback:
      "Admin contains addProduct(), removeProduct(), and viewReports(). This combination of product management and reporting gives it medium cohesion — two distinct responsibilities.",
  },
  {
    id: 8,
    question:
      "A class that interacts directly with many other classes is likely to have:",
    options: [
      "A larger estimated response set",
      "No response set",
      "No methods",
      "Zero coupling",
    ],
    correct: 0,
    feedback:
      "The estimated response set includes a class's own methods plus the methods of classes it directly interacts with. More interactions mean a larger estimated response set.",
  },
  {
    id: 9,
    question: "Which class is primarily responsible for sending notifications?",
    options: ["NotificationService", "DatabaseConnector", "Product", "Guest"],
    correct: 0,
    feedback:
      "NotificationService has a single method sendNotification(message) and dispatches to EmailService and SMSService, making notification dispatching its sole responsibility.",
  },
  {
    id: 10,
    question:
      "Which is an appropriate object-oriented design improvement for reducing unnecessary direct dependencies?",
    options: [
      "Use abstractions such as interfaces",
      "Increase direct dependencies",
      "Place all responsibilities into one class",
      "Duplicate functionality across every class",
    ],
    correct: 0,
    feedback:
      "Using abstractions (interfaces, abstract classes, dependency injection) allows classes to depend on stable contracts rather than concrete implementations, reducing coupling and improving flexibility.",
  },
];

// ─── Decoupling Strategies ───────────────────────────────────────

export interface Exp5Strategy {
  id: string;
  label: string;
  description: string;
  applicableTo: string[];
  before: string;
  after: string;
  metricChanges: {
    label: string;
    before: string;
    after: string;
    note: string;
  }[];
}

export const EXP5_STRATEGIES: Exp5Strategy[] = [
  {
    id: "interface",
    label: "Introduce Interface",
    description:
      "Define an abstract notification contract so that NotificationService depends on an interface rather than concrete EmailService and SMSService.",
    applicableTo: ["NotificationService", "ShoppingCart", "Invoice"],
    before: `NotificationService
├── EmailService
└── SMSService`,
    after: `NotificationService
└── «interface» INotification
    ├── EmailService
    └── SMSService`,
    metricChanges: [
      {
        label: "Direct Dependencies (NotificationService)",
        before: "2 (EmailService, SMSService)",
        after: "1 (INotification interface)",
        note: "Direct coupling to concrete classes is replaced by a single abstract contract.",
      },
      {
        label: "Coupling Classification",
        before: "Medium",
        after: "Low",
        note: "Outgoing count reduces to 1 interface dependency.",
      },
      {
        label: "Estimated Response Set",
        before: "3 (1 own + 2 concrete)",
        after: "2 (1 own + 1 interface)",
        note: "The interface defines the contract; implementations are substitutable.",
      },
      {
        label: "Responsibility Distribution",
        before: "Dispatches directly to concrete services",
        after: "Dispatches to abstraction; concrete classes implement the interface",
        note: "Each class retains a focused responsibility.",
      },
    ],
  },
  {
    id: "abstraction",
    label: "Service Abstraction",
    description:
      "Extract a shared service layer that mediates communication between Invoice/ShoppingCart and their downstream dependencies.",
    applicableTo: ["Invoice", "ShoppingCart"],
    before: `Invoice
├── DatabaseConnector
└── EmailService`,
    after: `Invoice
└── InvoiceService (mediator)
    ├── DatabaseConnector
    └── EmailService`,
    metricChanges: [
      {
        label: "Direct Dependencies (Invoice)",
        before: "2 (DatabaseConnector, EmailService)",
        after: "1 (InvoiceService abstraction)",
        note: "Invoice depends on a single mediating service.",
      },
      {
        label: "Coupling Classification",
        before: "Medium",
        after: "Low",
        note: "Invoice's outgoing interactions reduce from 2 to 1.",
      },
      {
        label: "Estimated Response Set",
        before: "4 (2 own + 2 downstream)",
        after: "3 (2 own + 1 mediator)",
        note: "Invoice's direct response set reduces; mediator handles downstream.",
      },
      {
        label: "Responsibility Distribution",
        before: "Invoice handles persistence and notification directly",
        after: "Invoice delegates via abstraction; InvoiceService handles orchestration",
        note: "Separation of concerns is improved.",
      },
    ],
  },
  {
    id: "separation",
    label: "Separate Responsibility",
    description:
      "Split Admin into two focused classes: ProductManager and ReportViewer, each with a single clear responsibility.",
    applicableTo: ["Admin"],
    before: `Admin
├── addProduct()
├── removeProduct()
└── viewReports()`,
    after: `ProductManager        ReportViewer
├── addProduct()       └── viewReports()
└── removeProduct()`,
    metricChanges: [
      {
        label: "Cohesion (Admin)",
        before: "Medium (two distinct responsibilities)",
        after: "High per new class (focused responsibility)",
        note: "Each new class handles one concern.",
      },
      {
        label: "Class Size",
        before: "Admin: 3 methods (Small)",
        after: "ProductManager: 2 methods; ReportViewer: 1 method (both Small)",
        note: "Classes become smaller and more focused.",
      },
      {
        label: "Coupling Classification",
        before: "Low (1 outgoing: Product)",
        after: "ProductManager: Low; ReportViewer: Low",
        note: "Coupling remains low; responsibility is cleaner.",
      },
      {
        label: "Responsibility Distribution",
        before: "Admin combines product management and reporting",
        after: "Each class has a single clear responsibility",
        note: "Adheres more closely to the Single Responsibility Principle.",
      },
    ],
  },
  {
    id: "injection",
    label: "Dependency Injection",
    description:
      "Pass dependencies (e.g., notification channel) into ShoppingCart at construction rather than having it create direct references internally.",
    applicableTo: ["ShoppingCart", "Invoice"],
    before: `ShoppingCart (creates)
├── Invoice
└── NotificationService`,
    after: `ShoppingCart (injected)
├── IInvoiceService (injected)
└── INotificationService (injected)`,
    metricChanges: [
      {
        label: "Direct Dependencies (ShoppingCart)",
        before: "2 (Invoice, NotificationService)",
        after: "2 injected interfaces (IInvoice, INotification)",
        note: "Number stays the same but targets are now abstractions, not concrete classes.",
      },
      {
        label: "Coupling Classification",
        before: "Medium",
        after: "Medium (same count; improved quality of dependency)",
        note: "Metric unchanged but testability and flexibility improve significantly.",
      },
      {
        label: "Estimated Response Set",
        before: "7 (4 own + 2+1 downstream)",
        after: "6 (4 own + interface contracts only)",
        note: "ShoppingCart no longer traverses concrete implementations.",
      },
      {
        label: "Responsibility Distribution",
        before: "ShoppingCart constructs its own dependencies",
        after: "Dependencies supplied externally; ShoppingCart focuses on cart logic",
        note: "Dependency Injection improves modularity and unit-testability.",
      },
    ],
  },
];
