import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import VJs from "./pages/VJs";
import Movies from "./pages/Movies";
import NewPopular from "./pages/NewPopular";
import MyList from "./pages/MyList";
import TitleDetail from "./pages/TitleDetail";
import Player from "./pages/Player";
import Profile from "./pages/Profile";

import Referrals from "./pages/Referrals";
import Download from "./pages/Download";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/vjs" element={<VJs />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/new-popular" element={<NewPopular />} />
        <Route path="/my-list" element={<MyList />} />
        <Route path="/title/:id" element={<TitleDetail />} />
        <Route path="/player/:id" element={<Player />} />
        <Route path="/profile" element={<Profile />} />
        
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/download" element={<Download />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
