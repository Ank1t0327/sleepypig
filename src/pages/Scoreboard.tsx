import { useNavigate } from "react-router-dom";
import { useGameData } from "@/hooks/useGameData";
import { calculateAccuracy } from "@/lib/gameData";
import { ArrowLeft, Trophy, Crown } from "lucide-react";

const Scoreboard = () => {
  const navigate = useNavigate();
  const { data } = useGameData();
  const { ankit, vasu } = data.scores;
  const ankitAcc = calculateAccuracy(data, "ankit");
  const vasuAcc = calculateAccuracy(data, "vasu");
  const leader = ankit > vasu ? "ankit" : vasu > ankit ? "vasu" : "tie";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Scoreboard</h1>
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
              <span className="text-3xl font-bold font-mono text-primary">{ankit.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${ankitAcc}%` }}
                />
              </div>
              <span className="text-sm font-mono text-muted-foreground">{ankitAcc}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Prediction accuracy</p>
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
              <span className="text-3xl font-bold font-mono text-primary">{vasu.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${vasuAcc}%` }}
                />
              </div>
              <span className="text-sm font-mono text-muted-foreground">{vasuAcc}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Prediction accuracy</p>
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
