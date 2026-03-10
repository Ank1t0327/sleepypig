import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameData } from "@/hooks/useGameData";
import { getDateString } from "@/lib/gameData";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { toast } from "sonner";

const MakeupClass = () => {
  const navigate = useNavigate();
  const { data, update } = useGameData();
  const [name, setName] = useState("");
  const [time, setTime] = useState("12:00");

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error("Enter a class name");
      return;
    }
    const date = getDateString();
    const hour = parseInt(time.split(":")[0], 10);
    const id = `custom-${Date.now()}`;
    update((prev) => {
      const customClasses = { ...prev.customClasses };
      if (!customClasses[date]) customClasses[date] = [];
      customClasses[date] = [
        ...customClasses[date],
        { id, name: name.trim(), time, hour, isCustom: true },
      ];
      return { ...prev, customClasses };
    });
    toast.success(`Added ${name.trim()} at ${time}`);
    setName("");
  };

  const todayCustom = data.customClasses[getDateString()] || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Add Makeup Class</h1>
        </div>

        <div className="card-glass rounded-xl p-5 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Class Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Extra DBMS"
              maxLength={50}
              className="w-full p-3 rounded-lg bg-secondary text-foreground border border-border focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-3 rounded-lg bg-secondary text-foreground border border-border focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <PlusCircle className="w-5 h-5" />
            Add Class
          </button>
        </div>

        {todayCustom.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-3 font-mono">Today's Makeup Classes</p>
            <div className="space-y-2">
              {todayCustom.map((cls) => (
                <div key={cls.id} className="card-glass rounded-lg p-3 flex justify-between">
                  <span className="font-medium">{cls.name}</span>
                  <span className="text-sm font-mono text-muted-foreground">{cls.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MakeupClass;
