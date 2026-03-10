import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTodayClasses,
  getDateString,
  getTodayName,
} from "@/lib/gameData";
import { ArrowLeft, Clock, User, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  createPrediction,
  fetchPredictions,
  fetchScores,
  postResult,
  type ApiPrediction,
} from "@/lib/api";

const Predictions = () => {
  const navigate = useNavigate();
  // Class schedule is still local; predictions/scores are loaded from the deployed API.
  const classes = getTodayClasses({
    scores: { ankit: 0, vasu: 0 },
    predictions: [],
    customClasses: {},
  } as any);
  const today = getTodayName();
  const date = getDateString();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ApiPrediction[]>([]);
  const [ankitScore, setAnkitScore] = useState(0);
  const [vasuScore, setVasuScore] = useState(0);

  const refreshAll = async () => {
    try {
      setLoading(true);
      const [preds, scores] = await Promise.all([fetchPredictions(), fetchScores()]);
      setItems(preds);

      if (Array.isArray(scores)) {
        const a = scores.find((s) => String((s as any).player).toLowerCase() === "ankit");
        const v = scores.find((s) => String((s as any).player).toLowerCase() === "vasu");
        setAnkitScore(Number((a as any)?.points ?? (a as any)?.score ?? 0) || 0);
        setVasuScore(Number((v as any)?.points ?? (v as any)?.score ?? 0) || 0);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshAll();
    const id = window.setInterval(() => void refreshAll(), 10_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const predictAbsent = async (className: string, player: "Ankit" | "Vasu") => {
    try {
      await createPrediction({ player, className, prediction: "absent" });
      toast.success(`${player} predicted ABSENT for ${className}`);
      await refreshAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save prediction");
    }
  };

  const setResult = (classId: string, result: "present" | "absent") => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return;
    void (async () => {
      try {
        await postResult({ className: cls.name, date, actual: result });
        toast.success(`Marked ${cls.name} as ${result.toUpperCase()}`);
        await refreshAll();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save result");
      }
    })();
  };

  const todaysPredictions = useMemo(() => {
    // Deployed API doesn't provide date in request shape; show everything.
    // Sort newest first if timestamps exist.
    return [...items].sort((a, b) => {
      const at = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bt - at;
    });
  }, [items]);

  if (today === "Sunday" || today === "Saturday") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-2xl mb-4">😴</p>
        <p className="text-lg text-muted-foreground">No classes today. Enjoy the weekend!</p>
        <button onClick={() => navigate("/")} className="mt-4 text-primary underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Today's Classes</h1>
            <p className="text-xs text-muted-foreground font-mono">{today} • {date}</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs font-mono text-muted-foreground">Scores</div>
            <div className="text-xs font-mono">
              <span className="text-primary">Ankit</span> {ankitScore.toFixed(2)} •{" "}
              <span className="text-primary">Vasu</span> {vasuScore.toFixed(2)}
            </div>
            <button
              onClick={() => void refreshAll()}
              disabled={loading}
              className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Classes */}
        <div className="space-y-3">
          {classes.map((cls) => {
            const now = new Date().getHours();
            const isPast = now >= cls.hour + 1;

            return (
              <div key={cls.id} className="relative">
                <div
                  className="card-glass rounded-xl p-4 animate-slide-up"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-mono text-sm text-muted-foreground">{cls.time}</span>
                    </div>
                    <span className="text-lg font-semibold">{cls.name}</span>
                    {cls.isCustom && (
                      <span className="text-[10px] uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Makeup
                      </span>
                    )}
                  </div>

                  {/* Prediction buttons */}
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => void predictAbsent(cls.name, "Ankit")}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 bg-secondary hover:bg-secondary/80"
                    >
                      <User className="w-3 h-3 inline mr-1" />
                      Ankit: ABSENT
                    </button>
                    <button
                      onClick={() => void predictAbsent(cls.name, "Vasu")}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 bg-secondary hover:bg-secondary/80"
                    >
                      <User className="w-3 h-3 inline mr-1" />
                      Vasu: ABSENT
                    </button>
                  </div>

                  {/* Result entry */}
                  {isPast && (
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => setResult(cls.id, "present")}
                        className="flex-1 py-2 rounded-lg bg-success/20 text-success text-sm font-medium active:scale-95"
                      >
                        <CheckCircle className="w-3 h-3 inline mr-1" /> Present
                      </button>
                      <button
                        onClick={() => setResult(cls.id, "absent")}
                        className="flex-1 py-2 rounded-lg bg-destructive/20 text-destructive text-sm font-medium active:scale-95"
                      >
                        <XCircle className="w-3 h-3 inline mr-1" /> Absent
                      </button>
                    </div>
                  )}

                  {/* Show result */}
                  <div className="text-center py-2 rounded-lg text-sm font-mono bg-secondary/60 text-muted-foreground">
                    &nbsp;
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {classes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No classes scheduled for today.</p>
          </div>
        )}

        {/* All predictions (from API) */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">All Predictions</h2>
            <span className="text-xs font-mono text-muted-foreground">
              {loading ? "Loading..." : `${todaysPredictions.length} total`}
            </span>
          </div>
          <div className="space-y-2">
            {todaysPredictions.map((p, idx) => (
              <div key={p._id ?? `${p.player}-${p.className}-${idx}`} className="card-glass rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{p.className}</div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                  </div>
                </div>
                <div className="text-sm mt-1">
                  <span className="font-mono text-muted-foreground">Player:</span>{" "}
                  <span className="text-primary">{String(p.player)}</span>{" "}
                  <span className="font-mono text-muted-foreground">Prediction:</span>{" "}
                  <span className="font-semibold">{String(p.prediction).toUpperCase()}</span>
                </div>
              </div>
            ))}
            {!loading && todaysPredictions.length === 0 && (
              <div className="text-sm text-muted-foreground">No predictions yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predictions;
