import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/useNotifications";
import { fetchChatMessages, type ChatMessage, createChat } from "@/lib/chat";
import Index from "./pages/Index";
import Predictions from "./pages/Predictions";
import Scoreboard from "./pages/Scoreboard";
import History from "./pages/History";
import MakeupClass from "./pages/MakeupClass";
import NotFound from "./pages/NotFound";
import BooleanPig from "./pages/BooleanPig";
import RingMasterPig from "./pages/RingMasterPig";

const DEFAULT_SENDER_KEY = "sleepypig-current-player";

const FloatingChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sender =
    (typeof window !== "undefined" && window.localStorage.getItem(DEFAULT_SENDER_KEY)) || "Ankit";

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchChatMessages({ limit: 50 });
      setMessages(data);
    } catch {
      // ignore errors in floating chat
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void load();
    const id = window.setInterval(() => {
      void load();
    }, 10000);
    return () => window.clearInterval(id);
  }, [open]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      await createChat({
        sender,
        text: input.trim(),
        context: "general",
      });
      setInput("");
      await load();
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 w-72 max-h-80 card-glass rounded-xl shadow-lg flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">SleepyPig Chat</span>
            <button
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 text-xs">
            {loading && <p className="text-muted-foreground">Loading…</p>}
            {!loading && messages.length === 0 && (
              <p className="text-muted-foreground">No messages in the last 24 hours.</p>
            )}
            {messages.map((m) => (
              <div key={m._id ?? `${m.timestamp}-${m.sender}-${m.text.slice(0, 8)}`}>
                <span className="font-semibold">{m.sender}:</span>{" "}
                <span className="text-foreground">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-2 py-2 flex items-center gap-2">
            <input
              className="flex-1 bg-secondary text-xs rounded-md px-2 py-1 border border-border focus:outline-none focus:border-primary"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <button
              className="text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground"
              onClick={() => void handleSend()}
            >
              Send
            </button>
          </div>
        </div>
      )}
      <button
        className="rounded-full w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat"
      >
        💬
      </button>
    </div>
  );
};

const queryClient = new QueryClient();

const AppInner = () => {
  useNotifications();

  return (
    <TooltipProvider>
      <Sonner
        position="top-center"
        toastOptions={{ className: "bg-card border-border text-foreground" }}
      />
      <BrowserRouter>
        <FloatingChat />
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Early Pig mode (existing functionality) */}
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/mode/earlypig" element={<Predictions />} />
          {/* Other modes */}
          <Route path="/mode/booleanpig" element={<BooleanPig />} />
          <Route path="/mode/ringmaster" element={<RingMasterPig />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/makeup" element={<MakeupClass />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppInner />
  </QueryClientProvider>
);

export default App;
