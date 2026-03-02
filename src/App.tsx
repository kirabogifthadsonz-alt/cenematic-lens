import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import VJs from "./pages/VJs";
import Movies from "./pages/Movies";
import NewPopular from "./pages/NewPopular";
import MyList from "./pages/MyList";
import TitleDetail from "./pages/TitleDetail";
import SeriesDetail from "./pages/SeriesDetail";
import Player from "./pages/Player";
import Wallet from "./pages/Wallet";
import Referrals from "./pages/Referrals";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Blog from "./pages/Blog";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import Copyright from "./pages/Copyright";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith("/admin");
  const isPlayerRoute = pathname.startsWith("/player");

  return (
    <>
      {!isAdminRoute && !isPlayerRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/vjs" element={<VJs />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/new-popular" element={<NewPopular />} />
        <Route path="/my-list" element={<MyList />} />
        <Route path="/title/:id" element={<TitleDetail />} />
        <Route path="/series/:id" element={<SeriesDetail />} />
        <Route path="/player/:id" element={<Player />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-use" element={<TermsOfUse />} />
        <Route path="/copyright" element={<Copyright />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdminRoute && !isPlayerRoute && <Footer />}
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
