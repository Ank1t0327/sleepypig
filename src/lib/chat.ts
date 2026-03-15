export async function createChat(input: {
  sender: string;
  text: string;
  context?: string;
  relatedId?: string;
}) {
  await fetch("https://sleepypig.onrender.com/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

