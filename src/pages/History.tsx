import { useNavigate } from "react-router-dom";
import { useGameData } from "@/hooks/useGameData";
import { ArrowLeft } from "lucide-react";

const History = () => {
  const navigate = useNavigate();
  const { data } = useGameData();

  const sorted = [...data.predictions]
    .filter((p) => p.ankitPredicted || p.vasuPredicted)
    .sort((a, b) => b.date.localeCompare(a.date) || b.classTime.localeCompare(a.classTime));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Prediction History</h1>
        </div>

        {sorted.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No predictions yet.</p>
        ) : (
          <div className="space-y-3">
            {sorted.map((p, i) => (
              <div key={i} className="card-glass rounded-xl p-4 animate-slide-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono text-muted-foreground">{p.date}</span>
                  <span className="font-semibold">
                    {p.className} – {p.classTime}
                  </span>
                </div>

                {p.ankitPredicted && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>Ankit predicted ABSENT</span>
                    {p.actualResult && (
                      <span>{p.actualResult === "absent" ? "✅" : "❌"}</span>
                    )}
                  </div>
                )}
                {p.vasuPredicted && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>Vasu predicted ABSENT</span>
                    {p.actualResult && (
                      <span>{p.actualResult === "absent" ? "✅" : "❌"}</span>
                    )}
                  </div>
                )}

                {p.wokeUp && <div className="text-xs text-warning mt-1 font-mono">☀️ Woke him up</div>}

                {p.actualResult && (
                  <div
                    className={`mt-2 text-xs font-mono px-2 py-1 rounded inline-block ${
                      p.actualResult === "absent"
                        ? "bg-destructive/20 text-destructive"
                        : "bg-success/20 text-success"
                    }`}
                  >
                    Result: {p.actualResult.toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
