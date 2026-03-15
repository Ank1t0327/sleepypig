import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ToggleLeft, User, Flag, CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { answerPoll, approvePoll, createPoll, fetchPolls, predictPoll, rejectPoll, type ApiPoll } from "@/lib/api";
import { getDateString } from "@/lib/gameData";
import { createChat } from "@/lib/chat";

type ModePlayer = "Ankit" | "Vasu";

const MAX_QUESTIONS_PER_DAY = 5;

const BooleanPig = () => {
  const navigate = useNavigate();
  const [player, setPlayer] = useState<ModePlayer>(() => {
    try {
      const raw = localStorage.getItem("sleepypig-current-player");
      return raw === "Vasu" ? "Vasu" : "Ankit";
    } catch {
      return "Ankit";
    }
  });
  const [question, setQuestion] = useState("");
  const [polls, setPolls] = useState<ApiPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const todayKey = getDateString();

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await fetchPolls();
      setPolls(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load polls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todaysPolls = useMemo(() => {
    return polls.filter((p) => {
      const d = new Date(p.date);
      const key = Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
      return key === todayKey;
    });
  }, [polls, todayKey]);

  const myTodayCount = useMemo(
    () => todaysPolls.filter((p) => p.askedBy === player).length,
    [todaysPolls, player],
  );

  const remainingSlots = Math.max(0, MAX_QUESTIONS_PER_DAY - myTodayCount);

  const opponent: ModePlayer = player === "Ankit" ? "Vasu" : "Ankit";

  const incoming = todaysPolls.filter(
    (p) => p.askedBy === opponent && !p.rejected && !p.answer,
  );

  const myRecent = todaysPolls.filter((p) => p.askedBy === player).slice(0, 5);

  const handleCreatePoll = async () => {
    if (!question.trim()) {
      toast.error("Write a question first.");
      return;
    }
    if (remainingSlots <= 0) {
      toast.error("You have used all 5 questions for today.");
      return;
    }
    try {
      setBusyId("create");
      await createPoll({
        question: question.trim(),
        askedBy: player,
        date: todayKey,
      });
      setQuestion("");
      toast.success("Question submitted for Boolean Pig.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit question");
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setBusyId(id);
      await approvePoll(id);
      toast.success("Poll approved.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve poll");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setBusyId(id);
      await rejectPoll(id);
      const msg = window.prompt("Add a message for this rejection (optional)");
      if (msg && msg.trim()) {
        try {
          await createChat({
            sender: player,
            text: msg.trim(),
            context: "poll",
            relatedId: id,
          });
        } catch {
          // ignore chat errors
        }
      }
      toast.message("Poll rejected. Slot is still used for the day.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reject poll");
    } finally {
      setBusyId(null);
    }
  };

  const handleAnswer = async (id: string, ans: "yes" | "no") => {
    try {
      setBusyId(id);
      await answerPoll(id, ans);
      toast.success("Answer submitted. Scores updated.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to answer poll");
    } finally {
      setBusyId(null);
    }
  };

  const handlePredict = async (id: string, ans: "yes" | "no") => {
    try {
      setBusyId(id);
      await predictPoll({ id, predictedBy: player, prediction: ans });
      toast.success("Prediction locked in.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to set prediction");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ToggleLeft className="w-5 h-5 text-primary" />
              Boolean Pig
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Yes/No mind games for SleepyPig.
            </p>
          </div>
        </div>

        {/* Player selector + remaining slots */}
        <div className="card-glass rounded-xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">You are</span>
          </div>
          <div className="inline-flex rounded-full bg-secondary p-1">
            {(["Ankit", "Vasu"] as ModePlayer[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPlayer(p);
                  try {
                    localStorage.setItem("sleepypig-current-player", p);
                  } catch {
                    // ignore
                  }
                }}
                className={`px-3 py-1 text-xs rounded-full font-mono transition-colors ${
                  player === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4 text-xs font-mono text-muted-foreground flex justify-between">
          <span>Today: {todayKey}</span>
          <span>
            Remaining questions:{" "}
            <span className="text-primary font-semibold">{remainingSlots}</span> / {MAX_QUESTIONS_PER_DAY}
          </span>
        </div>

        {/* Create poll */}
        <div className="card-glass rounded-xl p-4 mb-6 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
            Ask SleepyPig a yes/no question
          </p>
          <textarea
            className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
            rows={3}
            placeholder="e.g. Will he attend the 9AM lecture?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={140}
          />
          <div className="flex items-center justify-end">
            <button
              onClick={handleCreatePoll}
              disabled={busyId === "create" || remainingSlots <= 0}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] disabled:opacity-60"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Incoming polls for approval/answer */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">From {opponent}</h2>
            <span className="text-xs font-mono text-muted-foreground">
              {loading ? "Refreshing..." : `${incoming.length} open`}
            </span>
          </div>
          {incoming.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pending polls from {opponent}.</p>
          ) : (
            <div className="space-y-3">
              {incoming.map((p) => (
                <div key={p._id} className="card-glass rounded-xl p-3 text-sm space-y-2">
                  <p className="font-medium">{p.question}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    Prediction: {String(p.prediction ?? "").toUpperCase() || "—"}
                  </p>
                  {!p.approved && !p.rejected && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleApprove(p._id!)}
                        disabled={busyId === p._id}
                        className="flex-1 py-1.5 rounded-lg bg-success/15 text-success text-xs font-medium active:scale-95"
                      >
                        <Flag className="w-3 h-3 inline mr-1" /> Approve
                      </button>
                      <button
                        onClick={() => void handleReject(p._id!)}
                        disabled={busyId === p._id}
                        className="flex-1 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium active:scale-95"
                      >
                        <Flag className="w-3 h-3 inline mr-1" /> Reject
                      </button>
                    </div>
                  )}
                  {p.approved && !p.rejected && !p.answer && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-border">
                      {!p.prediction ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => void handlePredict(p._id!, "yes")}
                            disabled={busyId === p._id}
                            className="flex-1 py-1.5 rounded-lg bg-success/20 text-success text-xs font-medium active:scale-95"
                          >
                            <CheckCircle className="w-3 h-3 inline mr-1" /> I predict YES
                          </button>
                          <button
                            onClick={() => void handlePredict(p._id!, "no")}
                            disabled={busyId === p._id}
                            className="flex-1 py-1.5 rounded-lg bg-destructive/20 text-destructive text-xs font-medium active:scale-95"
                          >
                            <XCircle className="w-3 h-3 inline mr-1" /> I predict NO
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => void handleAnswer(p._id!, "yes")}
                            disabled={busyId === p._id}
                            className="flex-1 py-1.5 rounded-lg bg-success/20 text-success text-xs font-medium active:scale-95"
                          >
                            <CheckCircle className="w-3 h-3 inline mr-1" /> Event YES
                          </button>
                          <button
                            onClick={() => void handleAnswer(p._id!, "no")}
                            disabled={busyId === p._id}
                            className="flex-1 py-1.5 rounded-lg bg-destructive/20 text-destructive text-xs font-medium active:scale-95"
                          >
                            <XCircle className="w-3 h-3 inline mr-1" /> Event NO
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent my polls */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Your polls today</h2>
            <span className="text-xs font-mono text-muted-foreground">
              {myTodayCount} used / {MAX_QUESTIONS_PER_DAY}
            </span>
          </div>
          {myRecent.length === 0 ? (
            <p className="text-xs text-muted-foreground">You haven't asked any Boolean Pig questions yet today.</p>
          ) : (
            <div className="space-y-2">
              {myRecent.map((p) => (
                <div key={p._id} className="card-glass rounded-xl p-3 text-xs space-y-1">
                  <p className="font-medium text-sm">{p.question}</p>
                  <p className="font-mono text-muted-foreground">
                    Prediction:{" "}
                    <span className="text-primary font-semibold">
                      {String(p.prediction ?? "").toUpperCase() || "—"}
                    </span>
                  </p>
                  <p className="font-mono text-muted-foreground">
                    Status:{" "}
                    {p.rejected
                      ? "Rejected"
                      : p.approved
                      ? p.answer
                        ? `Answered: ${String(p.answer).toUpperCase()}`
                        : "Approved – waiting for answer"
                      : "Pending approval"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BooleanPig;

