import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchPredictions, type ApiPrediction } from "@/lib/api";
import { toast } from "sonner";

const History = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ApiPrediction[]>([]);

  const refresh = async () => {
    try {
      setLoading(true);
      const preds = await fetchPredictions();
      setItems(preds);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load history");
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

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const at = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bt - at;
    });
  }, [items]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-between flex-1">
            <h1 className="text-xl font-bold">Prediction History</h1>
            <button
              onClick={() => void refresh()}
              className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {loading ? "Loading..." : "No predictions yet."}
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((p, i) => (
              <div key={p._id ?? `${p.player}-${p.className}-${i}`} className="card-glass rounded-xl p-4 animate-slide-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono text-muted-foreground">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                  </span>
                  <span className="font-semibold">{p.className}</span>
                </div>

                <div className="text-sm">
                  <span className="font-mono text-muted-foreground">Player:</span>{" "}
                  <span className="text-primary">{String(p.player)}</span>{" "}
                  <span className="font-mono text-muted-foreground">Prediction:</span>{" "}
                  <span className="font-semibold">{String(p.prediction).toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
