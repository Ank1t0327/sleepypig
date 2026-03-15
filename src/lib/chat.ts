export type ChatMessage = {
  _id?: string;
  sender: string;
  text: string;
  context?: string | null;
  relatedId?: string | null;
  timestamp: string;
};

const CHAT_API_BASE = "https://sleepypig.onrender.com";

export async function createChat(input: {
  sender: string;
  text: string;
  context?: string;
  relatedId?: string;
}) {
  await fetch(`${CHAT_API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function fetchChatMessages(params?: {
  context?: string;
  relatedId?: string;
  limit?: number;
}): Promise<ChatMessage[]> {
  const searchParams = new URLSearchParams();
  if (params?.context) searchParams.set("context", params.context);
  if (params?.relatedId) searchParams.set("relatedId", params.relatedId);
  if (params?.limit != null) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  const url = `${CHAT_API_BASE}/chat${qs ? `?${qs}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Chat API ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as ChatMessage[];
  return data;
}

