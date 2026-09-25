// ============================================================
// Experiment 4 — Customer Satisfaction Metrics
// All identifiers prefixed exp4_ for isolation
// ============================================================

// ─── Types ───────────────────────────────────────────────────

export interface Exp4Response {
  id: number;
  overall: number;
  easeOfUse: number;
  performance: number;
  reliability: number;
  features: number;
  comment: string;
}

export type Exp4Factor = "overall" | "easeOfUse" | "performance" | "reliability" | "features";

export const EXP4_FACTOR_LABELS: Record<Exp4Factor, string> = {
  overall: "Overall Satisfaction",
  easeOfUse: "Ease of Use",
  performance: "Performance",
  reliability: "Reliability",
  features: "Features",
};

export const EXP4_FACTORS: Exp4Factor[] = [
  "overall",
  "easeOfUse",
  "performance",
  "reliability",
  "features",
];

export type Exp4Tab =
  | "aim"
  | "objective"
  | "theory"
  | "procedure"
  | "exercise"
  | "simulation"
  | "results"
  | "comparison"
  | "conclusion";

export const EXP4_TABS: { id: Exp4Tab; label: string }[] = [
  { id: "aim", label: "Aim" },
  { id: "objective", label: "Objective" },
  { id: "theory", label: "Theory" },
  { id: "procedure", label: "Procedure" },
  { id: "exercise", label: "Exercise" },
  { id: "simulation", label: "Simulation" },
  { id: "results", label: "Results" },
  { id: "comparison", label: "Comparison" },
  { id: "conclusion", label: "Conclusion" },
];

// ─── Applications ─────────────────────────────────────────────

export const EXP4_APPS: string[] = [
  "WhatsApp",
  "Instagram",
  "YouTube",
  "Zomato",
  "Swiggy",
  "Amazon",
  "Flipkart",
  "PayTM",
  "PhonePe",
  "Google Pay",
  "Google Maps",
  "Spotify",
  "Gaana",
  "Netflix",
  "Hotstar",
  "Gmail",
  "LinkedIn",
  "Microsoft Teams",
  "Zoom",
];

// ─── Sample Comments ──────────────────────────────────────────

const EXP4_SAMPLE_COMMENTS: Record<string, string[]> = {
  WhatsApp: [
    "Loading messages is sometimes slow on poor networks.",
    "Very easy to use and navigate between chats.",
    "Notifications are not always reliable.",
    "Overall a stable and reliable messaging app.",
    "Could add more features for group management.",
    "The interface is clean and simple to understand.",
    "Sometimes crashes when switching between chats quickly.",
    "Security and privacy features are excellent.",
    "Need better support options when issues arise.",
    "Performance is good most of the time.",
    "Easy to find contacts and start conversations.",
    "Sometimes slow to load images and videos.",
    "Very reliable for everyday communication.",
    "Would like more customization features.",
    "The design looks a bit outdated compared to other apps.",
    "Helpful customer support documentation available.",
    "Notifications work well most of the time.",
    "Sometimes the app freezes unexpectedly.",
    "Navigation between different sections is straightforward.",
    "Good performance even on older devices.",
    "Simple and fast for quick messages.",
    "Privacy settings are easy to manage.",
    "Would love a search within groups feature.",
    "Reliable and rarely has downtime.",
    "Great for voice and video calls.",
    "The UI needs a modernization update.",
    "Support articles could be more detailed.",
    "Crashes occasionally during video calls.",
    "Easy to use for all age groups.",
    "Fast loading of messages and media.",
    "Would like more notification customization options.",
    "Very stable and dependable for daily use.",
    "More features for business use would be helpful.",
    "The interface is intuitive and well organized.",
    "Performance drops with too many active chats.",
    "Privacy controls give me confidence using the app.",
    "Good balance between simplicity and functionality.",
    "Would like better search functionality.",
    "Notifications are mostly prompt and accurate.",
    "Rarely experiences errors or unexpected behavior.",
    "Fast and efficient for both text and media.",
    "Interface design is consistent and pleasant.",
    "Missing some advanced features found in competitors.",
    "Security features are a strong point.",
    "Support resources are available but limited.",
    "Very easy to set up and get started.",
    "Performance is generally smooth throughout.",
    "Occasional lag when loading large media files.",
    "Reliable connection even in low signal areas.",
    "Feature set covers most communication needs well.",
  ],
  Instagram: [
    "The feed loading speed could be improved.",
    "Very intuitive and visually appealing interface.",
    "Notifications are sometimes delayed.",
    "Generally stable but occasional crashes occur.",
    "Would like more editing tools for photos.",
    "Easy to browse and discover new content.",
    "Sometimes the app is slow to respond.",
    "Privacy settings could be more accessible.",
    "Support response time needs improvement.",
    "Performance is great on newer devices.",
    "Navigation between tabs is simple and clear.",
    "Videos take a while to buffer sometimes.",
    "Reliable for sharing photos and stories.",
    "Need more options to manage followers.",
    "The interface design is modern and attractive.",
    "Help center articles are somewhat helpful.",
    "Story notifications arrive promptly.",
    "App sometimes freezes on Reels section.",
    "Very easy to create and share content.",
    "Fast loading when connection is strong.",
    "Would appreciate more privacy control options.",
    "Mostly stable with occasional minor glitches.",
    "Explore feature could be more personalized.",
    "Interface is visually engaging and well designed.",
    "Good performance for photo and video sharing.",
    "More filtering options for comments would help.",
    "Notifications can be overwhelming without customization.",
    "Rarely crashes under normal usage.",
    "Discovering new accounts is easy and fun.",
    "Fast and smooth scrolling through the feed.",
    "Would like better tools for content creators.",
    "Very reliable for staying connected with friends.",
    "More features for Stories customization needed.",
    "Clean and modern interface throughout the app.",
    "Performance sometimes drops during peak hours.",
    "Good security for protecting personal content.",
    "A helpful and straightforward application.",
    "Search functionality works well most of the time.",
    "Notifications are fairly consistent and timely.",
    "Solid reliability for an entertainment platform.",
    "Quick to share and interact with content.",
    "Interface has a great visual hierarchy.",
    "Would like more control over ad preferences.",
    "Security updates are applied regularly.",
    "Basic support options are available and useful.",
    "Simple to sign in and navigate daily.",
    "Generally smooth performance across features.",
    "Buffering can be an issue for longer videos.",
    "Quite dependable for everyday social use.",
    "Feature variety keeps the app engaging.",
  ],
  YouTube: [
    "Videos sometimes buffer even with fast internet.",
    "Very easy to search and find videos.",
    "Notifications for subscriptions arrive promptly.",
    "Stable and rarely encounters major errors.",
    "Offline download feature is very useful.",
    "The interface is clean and well organized.",
    "Sometimes slow to load recommended videos.",
    "Privacy settings are adequate but could improve.",
    "Support documentation covers most common issues.",
    "Performance is excellent on most devices.",
    "Navigation between home, explore, and library is smooth.",
    "High definition video loading could be faster.",
    "Very reliable for streaming content.",
    "Would like better playlist management tools.",
    "The interface design is clean and functional.",
    "Creator Studio support is particularly helpful.",
    "Push notifications for live streams are timely.",
    "Very occasional lag during high-resolution playback.",
    "Intuitive to find and manage subscriptions.",
    "Fast buffering on most video resolutions.",
    "More granular privacy control would be welcome.",
    "Mostly stable with very few crashes.",
    "YouTube Shorts is a great addition to the platform.",
    "Video quality adapts well to network conditions.",
    "Great variety of content available.",
    "Download for offline feature works reliably.",
    "Notifications can be fine-tuned in settings.",
    "App is very stable during long viewing sessions.",
    "Search algorithm surfaces relevant content well.",
    "Smooth interface transitions throughout.",
    "Ad frequency could be reduced for better experience.",
    "Reliable video playback across different genres.",
    "More tools for playlist organization would help.",
    "Interface is consistent across mobile and web.",
    "Performance scales well with video resolution.",
    "Security measures seem robust and effective.",
    "Overall a very feature-rich application.",
    "Search results are accurate and relevant.",
    "Live stream notifications work well.",
    "Very dependable platform for video content.",
    "Quick start of video playback is appreciated.",
    "Simple and effective design throughout.",
    "Chapters feature for long videos is very useful.",
    "Good data protection practices observed.",
    "Help center is comprehensive and easy to navigate.",
    "Easy to find previously watched videos.",
    "Generally smooth performance across all features.",
    "Speed of video loading is usually excellent.",
    "Reliable recommendation engine keeps content fresh.",
    "Variety of features suits both viewers and creators.",
  ],
  Zomato: [
    "Delivery tracking is sometimes inaccurate.",
    "Very easy to browse menus and place orders.",
    "Order confirmation notifications arrive instantly.",
    "Reliable for most food delivery needs.",
    "More filter options for dietary preferences needed.",
    "The interface design is colorful and appealing.",
    "App can be slow during peak meal times.",
    "Privacy policy is clear and accessible.",
    "Customer support response is prompt.",
    "Fast performance when the server load is low.",
    "Easy to reorder favorite meals quickly.",
    "Estimated delivery time accuracy could improve.",
    "Very dependable for ordering from local restaurants.",
    "Would like better search for specific dishes.",
    "The design layout is intuitive for ordering.",
    "Support resolved my refund issue quickly.",
    "Real-time notifications help track my order.",
    "Occasionally the app crashes during checkout.",
    "Simple and straightforward ordering process.",
    "Fast loading of restaurant listings.",
    "Would appreciate more personalized recommendations.",
    "Stable and reliable throughout the ordering process.",
    "Loyalty program features are a good addition.",
    "Interface clearly shows pricing and ratings.",
    "Good app performance during non-peak hours.",
    "Better filtering by cuisine type would be helpful.",
    "Notifications keep me updated throughout delivery.",
    "Mostly stable with few unexpected errors.",
    "Easy to explore restaurants in my area.",
    "Speed of app is generally good on my device.",
    "More payment options would be convenient.",
    "Very reliable for getting food quickly.",
    "Detailed restaurant pages with menus are great.",
    "Design is vibrant and matches the brand well.",
    "Performance dips occasionally when many users order.",
    "Secure payment process gives me confidence.",
    "Good variety of restaurants to choose from.",
    "Search by dish name works well.",
    "Delivery status updates are timely.",
    "App rarely experiences errors in my experience.",
    "Quick and convenient for meal planning.",
    "Layout makes it easy to compare restaurant options.",
    "More vegetarian filter options would be helpful.",
    "Safe and secure payment gateway.",
    "Support chat is available and responsive.",
    "Easy account management and order history.",
    "Generally smooth performance throughout the day.",
    "Sometimes loading menus takes longer than expected.",
    "Reliable service with consistent delivery times.",
    "Good variety of features for food delivery needs.",
  ],
};

function exp4_getDefaultComments(count: number): string[] {
  const defaults = [
    "The application works well for everyday use.",
    "Performance could be improved in some areas.",
    "Easy to navigate and find what I need.",
    "Notifications are mostly timely and relevant.",
    "Would like to see more features added.",
    "The interface is clean and intuitive.",
    "Occasionally slow when loading content.",
    "Reliable and stable during regular usage.",
    "Privacy controls could be more accessible.",
    "Good overall experience with the application.",
  ];
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(defaults[i % defaults.length]);
  }
  return result;
}

// ─── Sample Data Generator ────────────────────────────────────

export function exp4_generateSampleResponses(app: string, count: number): Exp4Response[] {
  const comments = EXP4_SAMPLE_COMMENTS[app] ?? exp4_getDefaultComments(50);

  // Each app has a characteristic "profile" of ratings
  const profiles: Record<string, { overall: number[]; easeOfUse: number[]; performance: number[]; reliability: number[]; features: number[] }> = {
    WhatsApp:       { overall: [4,5,4,4,5], easeOfUse: [5,5,4,5,4], performance: [3,4,4,3,4], reliability: [5,4,5,4,5], features: [3,3,4,3,4] },
    Instagram:      { overall: [4,4,5,3,4], easeOfUse: [4,5,4,4,5], performance: [3,3,4,3,4], reliability: [4,3,4,4,3], features: [4,5,5,4,4] },
    YouTube:        { overall: [5,4,5,4,5], easeOfUse: [4,5,5,4,5], performance: [4,4,5,4,4], reliability: [5,5,4,5,5], features: [5,5,4,5,5] },
    Zomato:         { overall: [4,3,4,4,3], easeOfUse: [4,4,5,4,4], performance: [3,3,4,3,3], reliability: [3,4,3,4,3], features: [4,4,4,3,4] },
    Swiggy:         { overall: [4,4,3,4,4], easeOfUse: [4,4,4,5,4], performance: [3,4,3,3,4], reliability: [4,3,4,3,4], features: [4,3,4,4,3] },
    Amazon:         { overall: [5,4,5,5,4], easeOfUse: [4,5,4,4,5], performance: [4,4,5,4,4], reliability: [5,5,4,5,5], features: [5,5,5,4,5] },
    Flipkart:       { overall: [4,4,4,3,4], easeOfUse: [4,4,5,4,4], performance: [3,4,4,3,4], reliability: [4,4,3,4,4], features: [4,4,5,3,4] },
    PayTM:          { overall: [3,4,4,3,4], easeOfUse: [3,4,3,4,3], performance: [3,3,4,3,3], reliability: [4,3,4,3,4], features: [3,4,3,4,3] },
    PhonePe:        { overall: [4,5,4,5,4], easeOfUse: [4,5,5,4,5], performance: [4,4,5,4,5], reliability: [5,4,5,5,4], features: [4,4,4,5,4] },
    "Google Pay":   { overall: [5,4,5,5,4], easeOfUse: [5,5,4,5,5], performance: [5,4,5,4,5], reliability: [5,5,4,5,5], features: [4,4,5,4,4] },
    "Google Maps":  { overall: [5,5,4,5,5], easeOfUse: [5,4,5,4,5], performance: [4,5,4,5,4], reliability: [5,5,5,4,5], features: [5,4,5,5,4] },
    Spotify:        { overall: [5,4,5,4,5], easeOfUse: [5,5,4,5,4], performance: [5,4,5,4,5], reliability: [4,5,4,5,5], features: [5,5,4,5,4] },
    Gaana:          { overall: [3,4,3,3,4], easeOfUse: [4,3,4,3,4], performance: [3,3,3,4,3], reliability: [3,4,3,3,4], features: [4,3,4,3,3] },
    Netflix:        { overall: [5,5,4,5,4], easeOfUse: [5,4,5,5,4], performance: [4,5,4,4,5], reliability: [5,4,5,5,4], features: [5,5,4,5,5] },
    Hotstar:        { overall: [4,4,4,3,4], easeOfUse: [4,4,4,4,3], performance: [3,4,3,4,4], reliability: [4,3,4,3,4], features: [4,4,4,4,3] },
    Gmail:          { overall: [5,4,5,5,4], easeOfUse: [5,5,4,5,5], performance: [4,5,5,4,5], reliability: [5,5,4,5,5], features: [4,4,5,4,4] },
    LinkedIn:       { overall: [3,4,3,4,3], easeOfUse: [3,4,4,3,4], performance: [3,3,4,3,3], reliability: [4,3,4,4,3], features: [4,4,3,4,4] },
    "Microsoft Teams": { overall: [3,4,3,4,3], easeOfUse: [3,3,4,3,4], performance: [3,3,3,4,3], reliability: [4,3,4,3,4], features: [4,4,3,4,4] },
    Zoom:           { overall: [4,4,3,4,4], easeOfUse: [4,4,4,3,4], performance: [3,4,3,4,3], reliability: [4,3,4,4,3], features: [4,4,4,3,4] },
  };

  const profile = profiles[app] ?? profiles["YouTube"];

  const seededRandom = (seed: number, min: number, max: number): number => {
    const x = Math.sin(seed) * 10000;
    const r = x - Math.floor(x);
    return Math.round(min + r * (max - min));
  };

  const responses: Exp4Response[] = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 137 + app.charCodeAt(0) * 31;
    const pick = (arr: number[]) => {
      const base = arr[i % arr.length];
      const noise = seededRandom(seed + base, -1, 1);
      return Math.min(5, Math.max(1, base + noise));
    };
    responses.push({
      id: i + 1,
      overall: pick(profile.overall),
      easeOfUse: pick(profile.easeOfUse),
      performance: pick(profile.performance),
      reliability: pick(profile.reliability),
      features: pick(profile.features),
      comment: comments[i % comments.length] ?? "",
    });
  }
  return responses;
}

// ─── Metric Calculations ──────────────────────────────────────

export function exp4_factorAverage(responses: Exp4Response[], factor: Exp4Factor): number {
  if (!responses.length) return 0;
  const sum = responses.reduce((acc, r) => acc + r[factor], 0);
  return sum / responses.length;
}

export function exp4_overallAverage(responses: Exp4Response[]): number {
  if (!responses.length) return 0;
  const factors: Exp4Factor[] = ["overall", "easeOfUse", "performance", "reliability", "features"];
  const total = responses.reduce((acc, r) =>
    acc + factors.reduce((s, f) => s + r[f], 0), 0);
  return total / (responses.length * factors.length);
}

export function exp4_highestFactor(responses: Exp4Response[]): { factor: Exp4Factor; avg: number } | null {
  if (!responses.length) return null;
  let best: { factor: Exp4Factor; avg: number } | null = null;
  for (const f of EXP4_FACTORS) {
    const avg = exp4_factorAverage(responses, f);
    if (!best || avg > best.avg) best = { factor: f, avg };
  }
  return best;
}

export function exp4_lowestFactor(responses: Exp4Response[]): { factor: Exp4Factor; avg: number } | null {
  if (!responses.length) return null;
  let worst: { factor: Exp4Factor; avg: number } | null = null;
  for (const f of EXP4_FACTORS) {
    const avg = exp4_factorAverage(responses, f);
    if (!worst || avg < worst.avg) worst = { factor: f, avg };
  }
  return worst;
}

export function exp4_interpretScore(score: number): string {
  if (score <= 1.8) return "Very Low Satisfaction";
  if (score <= 2.6) return "Low Satisfaction";
  if (score <= 3.4) return "Moderate Satisfaction";
  if (score <= 4.2) return "High Satisfaction";
  return "Very High Satisfaction";
}

export function exp4_ratingDistribution(responses: Exp4Response[]): Record<number, number> {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of responses) {
    for (const f of EXP4_FACTORS) {
      const v = r[f];
      if (v >= 1 && v <= 5) dist[v]++;
    }
  }
  return dist;
}

export function exp4_satisfactionGroups(responses: Exp4Response[]): { dissatisfied: number; neutral: number; satisfied: number } {
  let dissatisfied = 0, neutral = 0, satisfied = 0;
  for (const r of responses) {
    for (const f of EXP4_FACTORS) {
      const v = r[f];
      if (v <= 2) dissatisfied++;
      else if (v === 3) neutral++;
      else satisfied++;
    }
  }
  return { dissatisfied, neutral, satisfied };
}

// ─── Theme Analysis ───────────────────────────────────────────

const EXP4_THEME_KEYWORDS: Record<string, string[]> = {
  Performance: ["slow", "lag", "fast", "speed", "loading", "buffer", "quick", "smooth", "performance"],
  Usability: ["easy", "difficult", "simple", "confusing", "navigate", "navigation", "intuitive", "complicated", "straightforward"],
  Features: ["feature", "option", "function", "tool", "functionality", "missing", "add", "more"],
  Reliability: ["crash", "error", "stable", "reliable", "reliability", "bug", "glitch", "freeze", "stable"],
  Interface: ["ui", "design", "interface", "layout", "appearance", "visual", "look", "aesthetic", "modern", "clean"],
  Notifications: ["notification", "alert", "notify", "reminder", "push"],
  Security: ["security", "privacy", "safe", "protect", "data", "private"],
  Support: ["support", "help", "customer service", "assistance", "helpdesk"],
};

export function exp4_analyzeThemes(responses: Exp4Response[]): { theme: string; mentions: number }[] {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    if (!r.comment.trim()) continue;
    const lower = r.comment.toLowerCase();
    for (const [theme, keywords] of Object.entries(EXP4_THEME_KEYWORDS)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          counts[theme] = (counts[theme] ?? 0) + 1;
          break;
        }
      }
    }
  }
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([theme, mentions]) => ({ theme, mentions }))
    .sort((a, b) => b.mentions - a.mentions);
}

// ─── Quiz Questions ───────────────────────────────────────────

export interface Exp4QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number; // 0-indexed
  feedback: string;
}

export const EXP4_QUIZ: Exp4QuizQuestion[] = [
  {
    id: 1,
    question: "What is the primary purpose of a customer satisfaction survey in software quality analysis?",
    options: [
      "To measure how users perceive the software experience",
      "To count source-code statements",
      "To measure CPU clock speed",
      "To determine database storage capacity",
    ],
    correct: 0,
    feedback:
      "Customer satisfaction surveys collect user perceptions and ratings to evaluate how well a software application meets user needs — a key dimension of software quality.",
  },
  {
    id: 2,
    question: "Which scale is used for the main rating questions in this experiment?",
    options: [
      "1–5 Likert scale",
      "1–100 binary scale",
      "0–2 hexadecimal scale",
      "10–100 logarithmic scale",
    ],
    correct: 0,
    feedback:
      "The 1–5 Likert scale maps qualitative opinions (Very Dissatisfied to Very Satisfied) onto ordinal numerical values that can be averaged and compared.",
  },
  {
    id: 3,
    question: "Twenty ratings have a total value of 80. What is the average satisfaction score?",
    options: ["2", "3", "4", "5"],
    correct: 2,
    feedback:
      "Average = Sum of Ratings ÷ Number of Ratings = 80 ÷ 20 = 4. This falls in the 'High Satisfaction' range on the laboratory interpretation scale.",
  },
  {
    id: 4,
    question: "If Performance has an average of 3.1 and Ease of Use has an average of 4.2, which factor has the higher rating?",
    options: [
      "Performance",
      "Ease of Use",
      "Both are equal",
      "Neither can be compared",
    ],
    correct: 1,
    feedback:
      "4.2 (Ease of Use) > 3.1 (Performance). Comparing factor averages directly tells us which aspect users rated more favourably.",
  },
  {
    id: 5,
    question: "What does the lowest-rated factor normally indicate?",
    options: [
      "An area requiring improvement",
      "The most successful feature",
      "The number of respondents",
      "The number of survey questions",
    ],
    correct: 0,
    feedback:
      "The factor with the lowest average rating highlights the area where users are least satisfied — making it the primary candidate for improvement.",
  },
  {
    id: 6,
    question: "Why is an open-ended question included in the survey?",
    options: [
      "To collect qualitative suggestions and feedback",
      "To calculate source-code complexity",
      "To measure network latency",
      "To calculate database size",
    ],
    correct: 0,
    feedback:
      "Open-ended questions let respondents express opinions in their own words, providing qualitative insights that numerical ratings alone cannot capture.",
  },
  {
    id: 7,
    question: "Ratings collected are 4, 5, 4, 3 and 4. What is the average?",
    options: ["3.0", "3.5", "4.0", "4.5"],
    correct: 2,
    feedback:
      "Average = (4 + 5 + 4 + 3 + 4) ÷ 5 = 20 ÷ 5 = 4.0. This is in the 'High Satisfaction' range on the interpretation scale.",
  },
  {
    id: 8,
    question: "What can be identified by comparing average ratings of individual factors?",
    options: [
      "Highest-rated and lowest-rated factors",
      "Number of source-code functions",
      "Number of database tables",
      "CPU utilization",
    ],
    correct: 0,
    feedback:
      "Comparing factor averages reveals the strongest-rated aspect (highest average) and the area most needing improvement (lowest average).",
  },
  {
    id: 9,
    question: "What type of information is obtained primarily from open-ended comments?",
    options: [
      "Qualitative feedback",
      "Source-code metrics",
      "Hardware specifications",
      "Network topology",
    ],
    correct: 0,
    feedback:
      "Open-ended responses yield qualitative feedback — opinions, suggestions, and observations that add context beyond what Likert ratings can express.",
  },
  {
    id: 10,
    question: "What is the minimum number of responses specified in the classroom exercise?",
    options: ["5", "10", "20", "50"],
    correct: 2,
    feedback:
      "The classroom exercise requires a minimum of 20 responses collected over a 10-minute period to ensure a statistically meaningful sample size.",
  },
];
