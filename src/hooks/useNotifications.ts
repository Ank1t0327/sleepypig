import { useEffect } from "react";
import { fetchPredictions, fetchPolls, fetchDares, type ApiPoll, type ApiDare, type ApiPrediction } from "@/lib/api";

const STORAGE_KEY = "sleepypig-notifications-state";

type NotificationState = {
  lastPredictionCreatedAt?: string;
  lastPollId?: string;
  lastPollApprovedId?: string;
  lastDareId?: string;
  lastDareApprovedId?: string;
};

function loadState(): NotificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as NotificationState;
  } catch {
    return {};
  }
}

function saveState(state: NotificationState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function notify(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

export function useNotifications() {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }

    let cancelled = false;

    const tick = async () => {
      try {
        const state = loadState();

        const [preds, polls, dares] = await Promise.all([
          fetchPredictions().catch(() => [] as ApiPrediction[]),
          fetchPolls().catch(() => [] as ApiPoll[]),
          fetchDares().catch(() => [] as ApiDare[]),
        ]);
        if (cancelled) return;

        // Prediction submitted (Early Pig)
        const latestPred = [...preds].sort((a, b) => {
          const at = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
          return bt - at;
        })[0];
        if (latestPred?.createdAt) {
          const latestTs = latestPred.createdAt;
          if (state.lastPredictionCreatedAt !== latestTs) {
            notify(
              "SleepyPig: New prediction",
              `New prediction recorded for ${latestPred.className}.`,
            );
            state.lastPredictionCreatedAt = latestTs;
          }
        }

        // Poll created & approved (Boolean Pig)
        const sortedPolls = [...polls].sort((a, b) => {
          const at = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
          return bt - at;
        });
        const latestPoll = sortedPolls[0];
        if (latestPoll?._id && state.lastPollId !== latestPoll._id) {
          notify(
            "SleepyPig: New Boolean Pig question",
            `${latestPoll.askedBy} asked: "${latestPoll.question}"`,
          );
          state.lastPollId = latestPoll._id;
        }
        const latestApprovedPoll = sortedPolls.find((p) => p.approved);
        if (latestApprovedPoll?._id && state.lastPollApprovedId !== latestApprovedPoll._id) {
          notify(
            "SleepyPig: Poll approved",
            `Boolean Pig poll approved: "${latestApprovedPoll.question}"`,
          );
          state.lastPollApprovedId = latestApprovedPoll._id;
        }

        // Dare created & approved (Ring Master)
        const sortedDares = [...dares].sort((a, b) => {
          const at = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
          return bt - at;
        });
        const latestDare = sortedDares[0];
        if (latestDare?._id && state.lastDareId !== latestDare._id) {
          notify(
            "SleepyPig: New dare",
            `${latestDare.createdBy} created a new dare.`,
          );
          state.lastDareId = latestDare._id;
        }
        const latestApprovedDare = sortedDares.find((d) => d.approved);
        if (latestApprovedDare?._id && state.lastDareApprovedId !== latestApprovedDare._id) {
          notify(
            "SleepyPig: Dare approved",
            `Dare approved for ${latestApprovedDare.createdBy}. Timer started.`,
          );
          state.lastDareApprovedId = latestApprovedDare._id;
        }

        saveState(state);
      } catch {
        // ignore polling errors
      }
    };

    // initial tick then poll every 10s
    void tick();
    const id = window.setInterval(() => void tick(), 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);
}

