import { useNavigate } from "react-router-dom";
import { useGameData } from "@/hooks/useGameData";
import { calculateSkipProbability, getTodayName } from "@/lib/gameData";
import { Moon, Trophy, Clock, PlusCircle, Trash2, Target } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { data, update } = useGameData();
  const skipProb = calculateSkipProbability(data);
  const today = getTodayName();

  const handleReset = () => {
    if (window.confirm("Reset ALL game data? This cannot be undone!")) {
      if (window.confirm("Are you really sure? All scores and predictions will be lost!")) {
        update(() => ({ scores: { ankit: 0, vasu: 0 }, predictions: [], customClasses: {} }));
        toast.success("Game data reset!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient relative overflow-hidden">
      {/* Background image overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url(/images/background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />

      <div className="relative z-10 max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center gap-2 mb-2">
            <Moon className="w-6 h-6 text-primary" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
              {today}
            </span>
          </div>
          <h1 className="text-3xl font-bold glow-text text-primary mb-1">
            Roommate Prediction League
          </h1>
          <p className="text-muted-foreground text-sm">Will he skip class today? 🤔</p>
        </div>

        {/* Skip Probability */}
        <div className="card-glass rounded-xl p-5 mb-6 animate-slide-up">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-mono">
            Today's Skip Chance
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${skipProb}%`,
                  background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--cosmic-orange-glow)))`,
                }}
              />
            </div>
            <span className="text-2xl font-bold font-mono text-primary">{skipProb}%</span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-3 flex-1">
          <NavButton
            onClick={() => navigate("/predictions")}
            icon={<Target className="w-5 h-5" />}
            label="Make Today's Prediction"
            accent
          />
          <NavButton
            onClick={() => navigate("/scoreboard")}
            icon={<Trophy className="w-5 h-5" />}
            label="Scoreboard"
          />
          <NavButton
            onClick={() => navigate("/history")}
            icon={<Clock className="w-5 h-5" />}
            label="Prediction History"
          />
          <NavButton
            onClick={() => navigate("/makeup")}
            icon={<PlusCircle className="w-5 h-5" />}
            label="Add Makeup Class"
          />
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors py-3"
        >
          <Trash2 className="w-4 h-4" />
          Reset Game Data
        </button>
      </div>
    </div>
  );
};

function NavButton({
  onClick,
  icon,
  label,
  accent,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all active:scale-[0.98] ${
        accent
          ? "bg-primary text-primary-foreground glow-orange font-semibold"
          : "card-glass hover:bg-secondary"
      }`}
    >
      {icon}
      <span className="text-base">{label}</span>
    </button>
  );
}

export default Index;
