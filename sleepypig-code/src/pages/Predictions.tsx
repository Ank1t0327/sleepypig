import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGameData } from "@/hooks/useGameData";
import {
  getTodayClasses,
  getTodayPrediction,
  getDateString,
  getTodayName,
  recalculateScores,
  Prediction,
} from "@/lib/gameData";
import { ArrowLeft, Clock, User, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const Predictions = () => {
  const navigate = useNavigate();
  const { data, update } = useGameData();
  const classes = getTodayClasses(data);
  const today = getTodayName();
  const date = getDateString();
  const [showWoke, setShowWoke] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleLongPressStart = useCallback((classId: string) => {
    longPressTimer.current = setTimeout(() => {
      setShowWoke(classId);
    }, 600);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const predict = (classId: string, className: string, classTime: string, player: "ankit" | "vasu") => {
    update((prev) => {
      const predictions = [...prev.predictions];
      let existing = predictions.find((p) => p.date === date && p.classId === classId);
      if (!existing) {
        existing = {
          date,
          classId,
          className,
          classTime,
          ankitPredicted: false,
          vasuPredicted: false,
        };
        predictions.push(existing);
      }
      if (player === "ankit") existing.ankitPredicted = true;
      if (player === "vasu") existing.vasuPredicted = true;
      return { ...prev, predictions };
    });
    toast.success(`${player === "ankit" ? "Ankit" : "Vasu"} predicted ABSENT for ${className}`);
  };

  const setResult = (classId: string, result: "present" | "absent") => {
    update((prev) => {
      const predictions = prev.predictions.map((p) =>
        p.date === date && p.classId === classId ? { ...p, actualResult: result } : p
      );
      const newData = { ...prev, predictions };
      newData.scores = recalculateScores(newData);
      return newData;
    });
    toast.success(`Marked as ${result}`);
  };

  const markWoke = (classId: string) => {
    update((prev) => {
      const predictions = prev.predictions.map((p) =>
        p.date === date && p.classId === classId ? { ...p, wokeUp: true } : p
      );
      const newData = { ...prev, predictions };
      newData.scores = recalculateScores(newData);
      return newData;
    });
    setShowWoke(null);
    toast.success("Marked as woke up! ☀️");
  };

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
        </div>

        {/* Classes */}
        <div className="space-y-3">
          {classes.map((cls) => {
            const pred = getTodayPrediction(data, cls.id);
            const now = new Date().getHours();
            const isPast = now >= cls.hour + 1;

            return (
              <div key={cls.id} className="relative">
                <div
                  className="card-glass rounded-xl p-4 animate-slide-up"
                  onTouchStart={() => handleLongPressStart(cls.id)}
                  onTouchEnd={handleLongPressEnd}
                  onMouseDown={() => handleLongPressStart(cls.id)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
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

                  {/* Prediction status */}
                  {pred?.wokeUp && (
                    <div className="text-xs text-warning mb-2 font-mono">☀️ Woke him up</div>
                  )}

                  {/* Prediction buttons */}
                  {!pred?.actualResult && (
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => predict(cls.id, cls.name, cls.time, "ankit")}
                        disabled={pred?.ankitPredicted}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                          pred?.ankitPredicted
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-secondary hover:bg-secondary/80"
                        }`}
                      >
                        <User className="w-3 h-3 inline mr-1" />
                        {pred?.ankitPredicted ? "Ankit ✓" : "Ankit: ABSENT"}
                      </button>
                      <button
                        onClick={() => predict(cls.id, cls.name, cls.time, "vasu")}
                        disabled={pred?.vasuPredicted}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                          pred?.vasuPredicted
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-secondary hover:bg-secondary/80"
                        }`}
                      >
                        <User className="w-3 h-3 inline mr-1" />
                        {pred?.vasuPredicted ? "Vasu ✓" : "Vasu: ABSENT"}
                      </button>
                    </div>
                  )}

                  {/* Result entry */}
                  {isPast && pred && !pred.actualResult && (
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
                  {pred?.actualResult && (
                    <div
                      className={`text-center py-2 rounded-lg text-sm font-mono ${
                        pred.actualResult === "absent"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-success/20 text-success"
                      }`}
                    >
                      {pred.actualResult === "absent" ? "😴 ABSENT" : "📚 PRESENT"}
                    </div>
                  )}
                </div>

                {/* Woke popup */}
                {showWoke === cls.id && (
                  <div className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3 z-20 animate-slide-up">
                    <p className="text-sm font-medium">Woke him up? ☀️</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => markWoke(cls.id)}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium active:scale-95"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowWoke(null)}
                        className="px-6 py-2 bg-secondary rounded-lg text-sm active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {classes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No classes scheduled for today.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Predictions;
