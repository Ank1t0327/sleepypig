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

export const TIMETABLE: Record<string, ClassSlot[]> = {
  Monday: [
    { id: "mon-1", name: "OOPS", time: "9:00", hour: 9 },
    { id: "mon-2", name: "Math", time: "10:00", hour: 10 },
    { id: "mon-3", name: "COD", time: "11:00", hour: 11 },
  ],
  Tuesday: [
    { id: "tue-1", name: "Java", time: "9:00", hour: 9 },
    { id: "tue-2", name: "COD", time: "10:00", hour: 10 },
    { id: "tue-3", name: "DBMS", time: "11:00", hour: 11 },
  ],
  Wednesday: [
    { id: "wed-1", name: "Networks", time: "9:00", hour: 9 },
    { id: "wed-2", name: "Java", time: "10:00", hour: 10 },
    { id: "wed-3", name: "COD", time: "11:00", hour: 11 },
  ],
  Thursday: [
    { id: "thu-1", name: "OOPS", time: "9:00", hour: 9 },
    { id: "thu-2", name: "DBMS", time: "10:00", hour: 10 },
    { id: "thu-3", name: "Networks", time: "11:00", hour: 11 },
  ],
  Friday: [
    { id: "fri-1", name: "COD", time: "9:00", hour: 9 },
    { id: "fri-2", name: "Java", time: "10:00", hour: 10 },
    { id: "fri-3", name: "Lab", time: "11:00", hour: 11 },
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
