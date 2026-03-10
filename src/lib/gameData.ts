export interface ClassSlot {
  id: string;
  name: string;
  time: string;
  hour: number;
  isCustom?: boolean;
}

export interface Prediction {
  date: string;
  classId: string;
  className: string;
  classTime: string;
  ankitPredicted: boolean;
  vasuPredicted: boolean;
  actualResult?: "present" | "absent";
  wokeUp?: boolean;
}

export interface GameData {
  scores: { ankit: number; vasu: number };
  predictions: Prediction[];
  customClasses: Record<string, ClassSlot[]>;
}

// Timetable derived from the shared screenshot
// Times are 1‑hour slots; "hour" is the starting hour in 24h format.
export const TIMETABLE: Record<string, ClassSlot[]> = {
  Monday: [
    { id: "mon-10", name: "CSE273", time: "10:00 - 11:00", hour: 10 },
    { id: "mon-11", name: "CSE273", time: "11:00 - 12:00", hour: 11 },
    { id: "mon-12", name: "INT428", time: "12:00 - 13:00", hour: 12 },
    { id: "mon-13", name: "CSE316", time: "13:00 - 14:00", hour: 13 },
    { id: "mon-15", name: "CSE211", time: "15:00 - 16:00", hour: 15 },
  ],
  Tuesday: [
    { id: "tue-09", name: "CSE211", time: "09:00 - 10:00", hour: 9 },
    { id: "tue-10", name: "CSE274", time: "10:00 - 11:00", hour: 10 },
    { id: "tue-11", name: "CSE274", time: "11:00 - 12:00", hour: 11 },
    { id: "tue-12", name: "CSE310", time: "12:00 - 13:00", hour: 12 },
    { id: "tue-13", name: "INT428", time: "13:00 - 14:00", hour: 13 },
    { id: "tue-15", name: "CSE316", time: "15:00 - 16:00", hour: 15 },
    { id: "tue-16", name: "PEA307", time: "16:00 - 17:00", hour: 16 },
  ],
  Wednesday: [
    { id: "wed-09", name: "PEA307", time: "09:00 - 10:00", hour: 9 },
    { id: "wed-10", name: "CSE316", time: "10:00 - 11:00", hour: 10 },
    { id: "wed-11", name: "INT428", time: "11:00 - 12:00", hour: 11 },
    { id: "wed-12", name: "CSE211", time: "12:00 - 13:00", hour: 12 },
  ],
  Thursday: [
    { id: "thu-10", name: "PEA307", time: "10:00 - 11:00", hour: 10 },
    { id: "thu-11", name: "CSE310", time: "11:00 - 12:00", hour: 11 },
    { id: "thu-12", name: "CSE310", time: "12:00 - 13:00", hour: 12 },
    { id: "thu-14", name: "CSE273", time: "14:00 - 15:00", hour: 14 },
    { id: "thu-15", name: "CSE273", time: "15:00 - 16:00", hour: 15 },
    { id: "thu-16", name: "INT428", time: "16:00 - 17:00", hour: 16 },
  ],
  Friday: [
    { id: "fri-09", name: "CSE325", time: "09:00 - 10:00", hour: 9 },
    { id: "fri-10", name: "CSE325", time: "10:00 - 11:00", hour: 10 },
    { id: "fri-11", name: "CSE310", time: "11:00 - 12:00", hour: 11 },
    { id: "fri-12", name: "CSE310", time: "12:00 - 13:00", hour: 12 },
    { id: "fri-14", name: "CSE274", time: "14:00 - 15:00", hour: 14 },
    { id: "fri-15", name: "CSE274", time: "15:00 - 16:00", hour: 15 },
    { id: "fri-16", name: "CSE211", time: "16:00 - 17:00", hour: 16 },
  ],
};

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getTodayName(): string {
  return DAYS[new Date().getDay()];
}

export function getDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STORAGE_KEY = "roommate-prediction-league";

export function loadGameData(): GameData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { scores: { ankit: 0, vasu: 0 }, predictions: [], customClasses: {} };
}

export function saveGameData(data: GameData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearGameData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getTodayClasses(data: GameData): ClassSlot[] {
  const day = getTodayName();
  const base = TIMETABLE[day] || [];
  const custom = data.customClasses[getDateString()] || [];
  return [...base, ...custom];
}

export function getTodayPrediction(data: GameData, classId: string): Prediction | undefined {
  const date = getDateString();
  return data.predictions.find((p) => p.date === date && p.classId === classId);
}

export function calculateSkipProbability(data: GameData): number {
  const resolved = data.predictions.filter((p) => p.actualResult);
  if (resolved.length === 0) return 50;
  const absent = resolved.filter((p) => p.actualResult === "absent").length;
  return Math.round((absent / resolved.length) * 100);
}

export function calculateAccuracy(data: GameData, player: "ankit" | "vasu"): number {
  const predicted = data.predictions.filter((p) => {
    if (player === "ankit") return p.ankitPredicted;
    return p.vasuPredicted;
  });
  const resolved = predicted.filter((p) => p.actualResult);
  if (resolved.length === 0) return 0;
  const correct = resolved.filter((p) => {
    const predictedAbsent = true; // they predicted absent
    return p.actualResult === "absent";
  }).length;
  return Math.round((correct / resolved.length) * 100);
}

export function recalculateScores(data: GameData): { ankit: number; vasu: number } {
  let ankit = 0;
  let vasu = 0;
  for (const p of data.predictions) {
    if (!p.actualResult) continue;
    if (p.wokeUp && p.actualResult === "present") {
      // both get 0
      continue;
    }
    if (p.ankitPredicted) {
      if (p.actualResult === "absent") ankit += 1;
      else ankit -= 0.25;
    }
    if (p.vasuPredicted) {
      if (p.actualResult === "absent") vasu += 1;
      else vasu -= 0.25;
    }
  }
  return { ankit, vasu };
}
