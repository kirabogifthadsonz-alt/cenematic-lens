import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-8 px-4 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground text-center md:text-left">
          Copyright © 2026 Hadz Group of Companies. All Rights Reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition">Privacy Policy</Link>
          <Link to="/terms-of-use" className="text-xs text-muted-foreground hover:text-foreground transition">Terms of Use</Link>
          <Link to="/copyright" className="text-xs text-muted-foreground hover:text-foreground transition">Cookie Policy</Link>
          <Link to="/copyright" className="text-xs text-muted-foreground hover:text-foreground transition">Copyright</Link>
          <Link to="/blog" className="text-xs text-muted-foreground hover:text-foreground transition">Blog</Link>
          <a href="mailto:contact@hadz.com" className="text-xs text-muted-foreground hover:text-foreground transition">Contact</a>
        </div>
      </div>
    </footer>
  );
}
