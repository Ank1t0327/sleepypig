import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/useNotifications";
import Index from "./pages/Index";
import Predictions from "./pages/Predictions";
import Scoreboard from "./pages/Scoreboard";
import History from "./pages/History";
import MakeupClass from "./pages/MakeupClass";
import NotFound from "./pages/NotFound";
import BooleanPig from "./pages/BooleanPig";
import RingMasterPig from "./pages/RingMasterPig";

const queryClient = new QueryClient();

const AppInner = () => {
  useNotifications();

  return (
    <TooltipProvider>
      <Sonner
        position="top-center"
        toastOptions={{ className: "bg-card border-border text-foreground" }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Early Pig mode (existing functionality) */}
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/mode/earlypig" element={<Predictions />} />
          {/* Other modes */}
          <Route path="/mode/booleanpig" element={<BooleanPig />} />
          <Route path="/mode/ringmaster" element={<RingMasterPig />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/makeup" element={<MakeupClass />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppInner />
  </QueryClientProvider>
);

export default App;
