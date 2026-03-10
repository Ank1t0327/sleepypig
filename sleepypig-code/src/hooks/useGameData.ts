import { useState, useCallback } from "react";
import { GameData, loadGameData, saveGameData } from "@/lib/gameData";

export function useGameData() {
  const [data, setData] = useState<GameData>(loadGameData);

  const update = useCallback((updater: (prev: GameData) => GameData) => {
    setData((prev) => {
      const next = updater(prev);
      saveGameData(next);
      return next;
    });
  }, []);

  const reload = useCallback(() => {
    setData(loadGameData());
  }, []);

  return { data, update, reload };
}
