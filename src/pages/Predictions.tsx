import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameData } from "@/hooks/useGameData";
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
  postResult,
  type ApiPrediction,
} from "@/lib/api";

const Predictions = () => {
  const navigate = useNavigate();
  const { data } = useGameData();
  const classes = getTodayClasses(data);
  const today = getTodayName();
  const date = getDateString();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ApiPrediction[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const getStartMinutes = (timeLabel: string, fallbackHour: number) => {
    const first = timeLabel.split("-")[0]?.trim() ?? "";
    const match = first.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const h = Number(match[1]);
      const m = Number(match[2]);
      if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
    }
    return fallbackHour * 60;
  };

  const refreshAll = async () => {
    try {
      setLoading(true);
      const preds = await fetchPredictions();
      setItems(preds);
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

  const todayDocs = useMemo(() => {
    const list = items.filter((p) => {
      const d = new Date(p.date);
      const key = Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
      return key === date;
    });
    const byClass = new Map<string, ApiPrediction>();
    for (const p of list) {
      const prev = byClass.get(p.className);
      if (!prev) {
        byClass.set(p.className, p);
        continue;
      }
      const pt = prev.updatedAt ? Date.parse(prev.updatedAt) : prev.createdAt ? Date.parse(prev.createdAt) : 0;
      const nt = p.updatedAt ? Date.parse(p.updatedAt) : p.createdAt ? Date.parse(p.createdAt) : 0;
      if (nt >= pt) byClass.set(p.className, p);
    }
    return byClass;
  }, [items, date]);

  const predictAbsent = async (className: string, player: "Ankit" | "Vasu") => {
    const doc = todayDocs.get(className);
    const already =
      player === "Ankit" ? doc?.ankitPrediction === "absent" : doc?.vasuPrediction === "absent";
    if (already) return;

    const key = `${className}:${player}`;
    try {
      setBusyKey(key);
      await createPrediction({ player, className, prediction: "absent", date });
      toast.success(`${player} predicted ABSENT for ${className}`);
      await refreshAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save prediction");
    } finally {
      setBusyKey(null);
    }
  };

  const setResult = (classId: string, result: "present" | "absent") => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return;
    const doc = todayDocs.get(cls.name);
    void (async () => {
      try {
        setBusyKey(`${cls.name}:result`);
        await postResult({ className: cls.name, date, actual: result });
        toast.success(`Marked ${cls.name} as ${result.toUpperCase()}`);
        await refreshAll();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save result");
      } finally {
        setBusyKey(null);
      }
    })();
  };

  const todaysPredictions = useMemo(() => {
    return Array.from(todayDocs.values()).sort((a, b) => a.className.localeCompare(b.className));
  }, [todayDocs]);

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
            <h1 className="text-xl font-bold">EARLY PIG</h1>
            <p className="text-xs text-muted-foreground font-mono">{today} • {date}</p>
          </div>
        </div>

        {/* Early Pig - first class only */}
        <div className="space-y-3">
          {classes.slice(0, 1).map((cls) => {
            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            const startMinutes = getStartMinutes(cls.time, cls.hour);
            const cutoffMinutes = startMinutes - 15;
            const canPredict = nowMinutes < cutoffMinutes;
            const isPast = nowMinutes >= startMinutes + 60; // 1h slot
            const doc = todayDocs.get(cls.name);
            const ankitDone = doc?.ankitPrediction === "absent";
            const vasuDone = doc?.vasuPrediction === "absent";
            const actual = doc?.actualResult ?? null;

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
                      onClick={() => {
                        if (!canPredict) {
                          toast.message("Predictions close 15 minutes before class starts.");
                          return;
                        }
                        void predictAbsent(cls.name, "Ankit");
                      }}
                      disabled={ankitDone || busyKey === `${cls.name}:Ankit`}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                        ankitDone
                          ? "bg-primary text-primary-foreground glow-orange font-semibold"
                          : canPredict
                            ? "bg-secondary hover:bg-secondary/80"
                            : "bg-secondary/40 text-muted-foreground cursor-not-allowed"
                      } ${ankitDone || busyKey === `${cls.name}:Ankit` ? "opacity-90" : ""}`}
                    >
                      <User className="w-3 h-3 inline mr-1" />
                      {ankitDone ? "Ankit ✓" : "Ankit: ABSENT"}
                    </button>
                    <button
                      onClick={() => {
                        if (!canPredict) {
                          toast.message("Predictions close 15 minutes before class starts.");
                          return;
                        }
                        void predictAbsent(cls.name, "Vasu");
                      }}
                      disabled={vasuDone || busyKey === `${cls.name}:Vasu`}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                        vasuDone
                          ? "bg-primary text-primary-foreground glow-orange font-semibold"
                          : canPredict
                            ? "bg-secondary hover:bg-secondary/80"
                            : "bg-secondary/40 text-muted-foreground cursor-not-allowed"
                      } ${vasuDone || busyKey === `${cls.name}:Vasu` ? "opacity-90" : ""}`}
                    >
                      <User className="w-3 h-3 inline mr-1" />
                      {vasuDone ? "Vasu ✓" : "Vasu: ABSENT"}
                    </button>
                  </div>

                  {/* Result entry */}
                  {isPast && (
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => setResult(cls.id, "present")}
                        disabled={busyKey === `${cls.name}:result` || actual === "present"}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium active:scale-95 ${
                          actual === "present" ? "bg-success text-success-foreground" : "bg-success/20 text-success"
                        }`}
                      >
                        <CheckCircle className="w-3 h-3 inline mr-1" /> Present
                      </button>
                      <button
                        onClick={() => setResult(cls.id, "absent")}
                        disabled={busyKey === `${cls.name}:result` || actual === "absent"}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium active:scale-95 ${
                          actual === "absent"
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        <XCircle className="w-3 h-3 inline mr-1" /> Absent
                      </button>
                    </div>
                  )}
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
            <h2 className="text-lg font-semibold">Today's Predictions</h2>
            <span className="text-xs font-mono text-muted-foreground">
              {loading ? "Loading..." : `${todaysPredictions.length} classes`}
            </span>
          </div>
          <div className="space-y-2">
            {todaysPredictions.map((p, idx) => (
              <div key={p._id ?? `${p.className}-${idx}`} className="card-glass rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{p.className}</div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                  </div>
                </div>
                <div className="text-sm mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    <span className="font-mono text-muted-foreground">Ankit:</span>{" "}
                    <span className={p.ankitPrediction ? "text-primary font-semibold" : "text-muted-foreground"}>
                      {p.ankitPrediction ? p.ankitPrediction.toUpperCase() : "—"}
                    </span>
                  </span>
                  <span>
                    <span className="font-mono text-muted-foreground">Vasu:</span>{" "}
                    <span className={p.vasuPrediction ? "text-primary font-semibold" : "text-muted-foreground"}>
                      {p.vasuPrediction ? p.vasuPrediction.toUpperCase() : "—"}
                    </span>
                  </span>
                  {p.actualResult && (
                    <span>
                      <span className="font-mono text-muted-foreground">Result:</span>{" "}
                      <span className="font-semibold">{p.actualResult.toUpperCase()}</span>
                    </span>
                  )}
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
