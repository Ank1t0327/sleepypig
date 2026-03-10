import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Crown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchScores } from "@/lib/api";
import { toast } from "sonner";

const Scoreboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ankit, setAnkit] = useState<number>(0);
  const [vasu, setVasu] = useState<number>(0);

  const leader = useMemo(() => {
    if (ankit > vasu) return "ankit";
    if (vasu > ankit) return "vasu";
    return "tie";
  }, [ankit, vasu]);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await fetchScores();

      // Supports either array form: [{player, points}] or object-ish responses.
      if (Array.isArray(data)) {
        const a = data.find((s) => String(s.player).toLowerCase() === "ankit");
        const v = data.find((s) => String(s.player).toLowerCase() === "vasu");
        const aPoints = (a && ("points" in a ? a.points : (a as any).score)) ?? 0;
        const vPoints = (v && ("points" in v ? v.points : (v as any).score)) ?? 0;
        setAnkit(Number(aPoints) || 0);
        setVasu(Number(vPoints) || 0);
      } else {
        const aPoints = (data as any)?.ankit ?? (data as any)?.Ankit ?? 0;
        const vPoints = (data as any)?.vasu ?? (data as any)?.Vasu ?? 0;
        setAnkit(Number(aPoints) || 0);
        setVasu(Number(vPoints) || 0);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load scores");
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-between flex-1">
            <h1 className="text-xl font-bold">Scoreboard</h1>
            <button
              onClick={() => void refresh()}
              className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Ankit */}
          <div
            className={`card-glass rounded-xl p-5 animate-slide-up ${
              leader === "ankit" ? "border-primary glow-orange-sm" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {leader === "ankit" && <Crown className="w-5 h-5 text-primary" />}
                <span className="text-lg font-semibold">Ankit</span>
              </div>
              <span className="text-3xl font-bold font-mono text-primary">
                {Number.isFinite(ankit) ? ankit.toFixed(2) : "0.00"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total points</p>
          </div>

          {/* Vasu */}
          <div
            className={`card-glass rounded-xl p-5 animate-slide-up ${
              leader === "vasu" ? "border-primary glow-orange-sm" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {leader === "vasu" && <Crown className="w-5 h-5 text-primary" />}
                <span className="text-lg font-semibold">Vasu</span>
              </div>
              <span className="text-3xl font-bold font-mono text-primary">
                {Number.isFinite(vasu) ? vasu.toFixed(2) : "0.00"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total points</p>
          </div>

          {leader === "tie" && (
            <p className="text-center text-muted-foreground text-sm font-mono">It's a tie! 🤝</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
