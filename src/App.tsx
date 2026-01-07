import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Games from "./pages/Games";
import GameDetail from "./pages/GameDetail";
import Pricing from "./pages/Pricing";
import Account from "./pages/Account";
import Subscription from "./pages/Subscription";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import About from "./pages/About";
import Login from "./pages/Login";
import Paywall from "./pages/Paywall";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { BettingChatBot } from "./components/BettingChatBot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/paywall" element={<Paywall />} />
            
            {/* Protected routes - require auth + subscription */}
            <Route path="/games" element={
              <ProtectedRoute requireSubscription>
                <Games />
              </ProtectedRoute>
            } />
            <Route path="/games/:gameId" element={
              <ProtectedRoute requireSubscription>
                <GameDetail />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute requireSubscription>
                <Chat />
              </ProtectedRoute>
            } />
            
            {/* Protected routes - require auth only */}
            <Route path="/account" element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            } />
            <Route path="/subscription" element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BettingChatBot />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
