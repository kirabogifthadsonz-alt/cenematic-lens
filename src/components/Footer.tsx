import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-6 px-4 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Cinematic Lens — HADZ GROUP OF COMPANIES</p>
        <div className="flex items-center gap-4">
          <Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition">Privacy Policy</Link>
          <Link to="/terms-of-use" className="text-xs text-muted-foreground hover:text-foreground transition">Terms of Use</Link>
          <Link to="/copyright" className="text-xs text-muted-foreground hover:text-foreground transition">Copyright</Link>
          <Link to="/blog" className="text-xs text-muted-foreground hover:text-foreground transition">Blog</Link>
        </div>
      </div>
    </footer>
  );
}
