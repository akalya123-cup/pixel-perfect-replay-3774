// Rule-based triage (keyword scoring). This is a clearly labelled FALLBACK, not a trained ML model.
// Replace with your FastAPI TF-IDF classifier by swapping these functions for API calls.

export const CATEGORIES = [
  "Electrical",
  "Plumbing",
  "IT and Networking",
  "Furniture",
  "Housekeeping",
  "Civil and Building Maintenance",
  "Laboratory Equipment",
  "AV Equipment",
  "Gardening",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type Priority = "Critical" | "High" | "Medium" | "Low";

const KEYWORDS: Record<Exclude<Category, "Other">, string[]> = {
  Electrical: ["fan", "light", "bulb", "switch", "socket", "power", "electric", "wire", "spark", "tube", "ac ", "air conditioner", "short circuit"],
  Plumbing: ["water", "leak", "tap", "pipe", "drain", "toilet", "flush", "sink", "washroom", "overflow"],
  "IT and Networking": ["wifi", "wi-fi", "internet", "network", "router", "lan", "computer", "pc", "login", "printer"],
  Furniture: ["desk", "chair", "bench", "table", "cupboard", "shelf", "drawer"],
  Housekeeping: ["dirty", "clean", "dustbin", "garbage", "trash", "smell", "dust", "unclean"],
  "Civil and Building Maintenance": ["wall", "crack", "ceiling", "window", "door", "floor", "tile", "paint", "roof", "stair"],
  "Laboratory Equipment": ["lab", "microscope", "oscilloscope", "equipment", "beaker", "fume", "instrument"],
  "AV Equipment": ["projector", "speaker", "mic", "microphone", "screen", "hdmi", "audio", "smart board"],
  Gardening: ["garden", "grass", "tree", "plant", "lawn", "branch", "hedge"],
};

const SAFETY = ["spark", "fire", "smoke", "shock", "short circuit", "exposed wire", "gas", "flood", "collapse", "injury", "danger"];
const URGENT = ["urgent", "not working", "broken", "entire", "whole", "all students", "exam", "no water", "no power"];

export interface Classification {
  category: Category;
  confidence: number;
  alternatives: { category: Category; score: number }[];
  needsReview: boolean;
}

export function classify(text: string): Classification {
  const t = ` ${text.toLowerCase()} `;
  const scores = Object.entries(KEYWORDS).map(([cat, kws]) => ({
    category: cat as Category,
    score: kws.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0),
  }));
  scores.sort((a, b) => b.score - a.score);
  const total = scores.reduce((n, s) => n + s.score, 0);
  if (!total) return { category: "Other", confidence: 0, alternatives: [], needsReview: true };
  const confidence = scores[0].score / total;
  return {
    category: scores[0].category,
    confidence,
    alternatives: scores.slice(1, 3).filter((s) => s.score > 0),
    needsReview: confidence < 0.6,
  };
}

export function recommendPriority(text: string, category: Category, relatedReports = 0): Priority {
  const t = text.toLowerCase();
  if (SAFETY.some((k) => t.includes(k))) return "Critical";
  let score = URGENT.filter((k) => t.includes(k)).length + relatedReports;
  if (category === "Electrical" || category === "Plumbing") score += 1;
  if (category === "Gardening" || category === "Other") score -= 1;
  if (score >= 3) return "High";
  if (score >= 1) return "Medium";
  return "Low";
}
