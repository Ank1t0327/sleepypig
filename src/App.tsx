import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Predictions from "./pages/Predictions";
import Scoreboard from "./pages/Scoreboard";
import History from "./pages/History";
import MakeupClass from "./pages/MakeupClass";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-center" toastOptions={{ className: "bg-card border-border text-foreground" }} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/makeup" element={<MakeupClass />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
