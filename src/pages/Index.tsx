import { useNavigate } from "react-router-dom";
import { useGameData } from "@/hooks/useGameData";
import { clearGameData, getTodayName } from "@/lib/gameData";
import { Moon, Trophy, Clock, PlusCircle, Trash2, Target } from "lucide-react";
import { toast } from "sonner";
import { resetGame } from "@/lib/api";

const Index = () => {
  const navigate = useNavigate();
  const { data, update } = useGameData();
  const today = getTodayName();

  const handleReset = () => {
    if (window.confirm("Reset ALL game data? This cannot be undone!")) {
      if (window.confirm("Are you really sure? All scores and predictions will be lost!")) {
        void (async () => {
          try {
            await resetGame();
          } catch {
            toast.error("Reset failed. Please try again.");
            return;
          }
          clearGameData();
          update(() => ({ scores: { ankit: 0, vasu: 0 }, predictions: [], customClasses: {} }));
          toast.success("Game data reset.");
        })();
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
            SleepyPig Prediction League
          </h1>
          <p className="text-muted-foreground text-sm">To kya karega aapka Suar? 🐷</p>
        </div>

        {/* Mode Selector */}
        <div className="space-y-3 flex-1">
          <NavButton
            onClick={() => navigate("/mode/earlypig")}
            icon={<Target className="w-5 h-5" />}
            label="Early Pig"
          />
          <NavButton
            onClick={() => navigate("/mode/booleanpig")}
            icon={<Clock className="w-5 h-5" />}
            label="Boolean Pig"
          />
          <NavButton
            onClick={() => navigate("/mode/ringmaster")}
            icon={<Trophy className="w-5 h-5" />}
            label="Ring Master of the Pig Bastard"
          />
          <NavButton
            onClick={() => navigate("/history")}
            icon={<Clock className="w-5 h-5" />}
            label="Prediction History"
          />
          <NavButton
            onClick={() => navigate("/scoreboard")}
            icon={<Trophy className="w-5 h-5" />}
            label="Scoreboard"
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
