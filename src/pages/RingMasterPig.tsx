import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, User, CheckCircle, XCircle, Timer } from "lucide-react";
import { toast } from "sonner";
import { approveDare, completeDare, createDare, fetchDares, type ApiDare } from "@/lib/api";
import { createChat } from "@/lib/chat";

type ModePlayer = "Ankit" | "Vasu";

const RingMasterPig = () => {
  const navigate = useNavigate();
  const [player, setPlayer] = useState<ModePlayer>(() => {
    try {
      const raw = localStorage.getItem("sleepypig-current-player");
      return raw === "Vasu" ? "Vasu" : "Ankit";
    } catch {
      return "Ankit";
    }
  });
  const [dareText, setDareText] = useState("");
  const [dares, setDares] = useState<ApiDare[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await fetchDares();
      setDares(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load dares");
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

  const opponent: ModePlayer = player === "Ankit" ? "Vasu" : "Ankit";

  const incoming = useMemo(
    () => dares.filter((d) => d.createdBy === opponent && !d.completed),
    [dares, opponent],
  );

  const myDares = useMemo(
    () => dares.filter((d) => d.createdBy === player).slice(0, 5),
    [dares, player],
  );

  const activeMine = myDares.find((d) => d.approved && !d.completed);

  const getRemainingSeconds = (deadline?: string | null) => {
    if (!deadline) return null;
    const end = new Date(deadline).getTime();
    if (Number.isNaN(end)) return null;
    const now = Date.now();
    const diff = Math.floor((end - now) / 1000);
    return diff;
  };

  const handleCreate = async () => {
    if (!dareText.trim()) {
      toast.error("Write a dare first.");
      return;
    }
    try {
      setBusyId("create");
      await createDare({ text: dareText.trim(), createdBy: player });
      setDareText("");
      toast.success("Dare submitted for approval.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit dare");
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setBusyId(id);
      await approveDare(id);
      toast.success("Dare approved. 10 minute timer started.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve dare");
    } finally {
      setBusyId(null);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      setBusyId(id);
      await completeDare(id);
      toast.success("Dare completion recorded. Scores updated.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to complete dare");
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
              <Sparkles className="w-5 h-5 text-primary" />
              Ring Master of the Pig Bastard
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Time-bound dares for SleepyPig. +3 if he pulls it off, -1.5 if he fails.
            </p>
          </div>
        </div>

        {/* Player selector */}
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

        {/* Create dare */}
        <div className="card-glass rounded-xl p-4 mb-6 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
            Create a dare for SleepyPig
          </p>
          <textarea
            className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
            rows={3}
            placeholder="e.g. He has to run to the main gate and back within 10 minutes."
            value={dareText}
            onChange={(e) => setDareText(e.target.value)}
            maxLength={200}
          />
          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              disabled={busyId === "create"}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] disabled:opacity-60"
            >
              Submit Dare
            </button>
          </div>
        </div>

        {/* Incoming dares from opponent */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Dares from {opponent}</h2>
            <span className="text-xs font-mono text-muted-foreground">
              {loading ? "Refreshing..." : `${incoming.length} listed`}
            </span>
          </div>
          {incoming.length === 0 ? (
            <p className="text-xs text-muted-foreground">No dares from {opponent} yet.</p>
          ) : (
            <div className="space-y-3">
              {incoming.map((d) => {
                const remaining = getRemainingSeconds(d.deadline ?? null);
                const isActive = d.approved && !d.completed && remaining !== null && remaining > 0;
                const seconds = remaining ?? 0;
                const mins = Math.max(0, Math.floor(seconds / 60));
                const secs = Math.max(0, seconds % 60);
                return (
                  <div key={d._id} className="card-glass rounded-xl p-3 text-sm space-y-2">
                    <p className="font-medium">{d.text}</p>
                    {d.approved ? (
                      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3 text-primary" />
                          {remaining !== null
                            ? `Time left: ${mins.toString().padStart(2, "0")}:${secs
                                .toString()
                                .padStart(2, "0")}`
                            : "Timer started"}
                        </span>
                        <span>{d.completed ? "Completed" : "Running"}</span>
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-muted-foreground">Waiting for approval</p>
                    )}
                    {!d.approved && !d.completed && !d.rejected && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => void handleApprove(d._id!)}
                          disabled={busyId === d._id}
                          className="flex-1 py-1.5 rounded-lg bg-success/15 text-success text-xs font-medium active:scale-95"
                        >
                          <CheckCircle className="w-3 h-3 inline mr-1" /> Approve &amp; Start Timer
                        </button>
                        <button
                          onClick={async () => {
                            const reason = window.prompt("Add a message for rejecting this dare (optional)");
                            try {
                              setBusyId(d._id!);
                              const res = await fetch("https://sleepypig.onrender.com/dare/reject", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: d._id }),
                              });
                              if (!res.ok) {
                                throw new Error("Failed to reject dare");
                              }
                              if (reason && reason.trim()) {
                                try {
                                  await createChat({
                                    sender: player,
                                    text: reason.trim(),
                                    context: "dare",
                                    relatedId: d._id,
                                  });
                                } catch {
                                  // ignore chat errors
                                }
                              }
                              toast.message("Dare rejected.");
                              await refresh();
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed to reject dare");
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          disabled={busyId === d._id}
                          className="flex-1 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium active:scale-95"
                        >
                          <XCircle className="w-3 h-3 inline mr-1" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My dares summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Your dares</h2>
            <span className="text-xs font-mono text-muted-foreground">
              {myDares.length} recent
            </span>
          </div>
          {myDares.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              You haven&apos;t created any Ring Master dares yet.
            </p>
          ) : (
            <div className="space-y-2">
              {myDares.map((d) => {
                const remaining = getRemainingSeconds(d.deadline ?? null);
                const isActive =
                  d.approved && !d.completed && remaining !== null && remaining > 0;
                const seconds = remaining ?? 0;
                const mins = Math.max(0, Math.floor(seconds / 60));
                const secs = Math.max(0, seconds % 60);
                return (
                  <div key={d._id} className="card-glass rounded-xl p-3 text-xs space-y-1">
                    <p className="font-medium text-sm">{d.text}</p>
                    <p className="font-mono text-muted-foreground">
                      Status:{" "}
                      {d.rejected
                        ? "Rejected"
                        : d.completed
                        ? "Completed (check scoreboard for points)"
                        : d.approved
                        ? remaining !== null
                          ? `Timer running: ${mins.toString().padStart(2, "0")}:${secs
                              .toString()
                              .padStart(2, "0")}`
                          : "Approved – timer started"
                        : "Pending approval"}
                    </p>
                    {isActive && (
                      <button
                        onClick={() => void handleComplete(d._id!)}
                        disabled={busyId === d._id}
                        className="mt-1 w-full py-1.5 rounded-lg bg-primary/80 text-primary-foreground font-medium active:scale-[0.98]"
                      >
                        Mark Dare Completed
                      </button>
                    )}
                    {d.approved && !d.completed && remaining !== null && remaining <= 0 && !d.scored && (
                      <button
                        onClick={() => void handleComplete(d._id!)}
                        disabled={busyId === d._id}
                        className="mt-1 w-full py-1.5 rounded-lg bg-destructive/80 text-destructive-foreground font-medium active:scale-[0.98]"
                      >
                        Time&apos;s up – Record Failure
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RingMasterPig;

