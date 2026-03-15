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
  createdAt?: string;
  updatedAt?: string;
};

export type ApiScore =
  | { player: PlayerName | string; points: number }
  | { player: PlayerName | string; score: number };

export type ApiPoll = {
  _id?: string;
  question: string;
  askedBy: string;
  approved: boolean;
  rejected: boolean;
  answer?: string | null;
  prediction?: string | null;
  date: string;
  scored?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiDare = {
  _id?: string;
  text: string;
  createdBy: string;
  approved: boolean;
  deadline?: string | null;
  completed: boolean;
  scored?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

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

// Boolean Pig / Poll APIs
export async function fetchPolls(): Promise<ApiPoll[]> {
  return requestJson<ApiPoll[]>("/polls");
}

export async function createPoll(input: {
  question: string;
  askedBy: string;
  prediction: "yes" | "no";
  date: string;
}): Promise<ApiPoll> {
  return requestJson<ApiPoll>("/poll", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function approvePoll(id: string): Promise<ApiPoll> {
  return requestJson<ApiPoll>("/poll/approve", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function rejectPoll(id: string): Promise<ApiPoll> {
  return requestJson<ApiPoll>("/poll/reject", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function answerPoll(id: string, answer: "yes" | "no"): Promise<unknown> {
  return requestJson("/poll/answer", {
    method: "POST",
    body: JSON.stringify({ id, answer }),
  });
}

// Ring Master / Dare APIs
export async function fetchDares(): Promise<ApiDare[]> {
  return requestJson<ApiDare[]>("/dares");
}

export async function createDare(input: {
  text: string;
  createdBy: string;
}): Promise<ApiDare> {
  return requestJson<ApiDare>("/dare", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function approveDare(id: string): Promise<ApiDare> {
  return requestJson<ApiDare>("/dare/approve", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function completeDare(id: string): Promise<unknown> {
  return requestJson("/dare/complete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

