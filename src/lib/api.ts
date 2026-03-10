const API_BASE_URL = "https://sleepypig.onrender.com";

export type PlayerName = "Ankit" | "Vasu";
export type PredictionValue = "absent" | "present";

export type ApiPrediction = {
  _id?: string;
  className: string;
  date: string;
  ankitPrediction?: PredictionValue | null;
  vasuPrediction?: PredictionValue | null;
  actualResult?: PredictionValue | null;
  woke?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiScore =
  | { player: PlayerName | string; points: number }
  | { player: PlayerName | string; score: number };

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }

  return (await res.json()) as T;
}

export async function fetchPredictions(): Promise<ApiPrediction[]> {
  return requestJson<ApiPrediction[]>("/predictions");
}

export async function createPrediction(input: {
  player: PlayerName;
  className: string;
  prediction: PredictionValue;
  date: string;
}): Promise<ApiPrediction> {
  return requestJson<ApiPrediction>("/predictions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchScores(): Promise<ApiScore[] | Record<string, unknown>> {
  return requestJson<ApiScore[] | Record<string, unknown>>("/scores");
}

export async function postResult(input: {
  className: string;
  date: string;
  actual: PredictionValue;
  woke?: boolean;
}): Promise<unknown> {
  return requestJson("/result", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function resetGame(): Promise<{ ok: true }> {
  return requestJson<{ ok: true }>("/reset", {
    method: "POST",
  });
}

