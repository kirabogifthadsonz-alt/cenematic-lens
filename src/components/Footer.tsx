import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[hsl(0_0%_6%)] border-t border-border text-muted-foreground py-10 px-6 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-semibold mb-4">
            <span style={{ color: "#FFC72C" }}>CINEMATIC</span>{" "}
            <span style={{ color: "#E50914" }}>LENS</span>
          </h3>
          <p className="text-sm">
            Movies, streamed your way<br />
            <span className="text-xs">(HADZ GROUP OF COMPANIES)</span>
          </p>
        </div>

        <div>
          <h4 className="text-foreground font-medium mb-3">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/terms-of-use" className="hover:text-foreground transition">Terms of Use</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-foreground transition">Privacy Policy</Link></li>
            <li><Link to="/cookie-policy" className="hover:text-foreground transition">Cookie Policy</Link></li>
            <li><Link to="/acceptable-use" className="hover:text-foreground transition">Acceptable Use Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-foreground font-medium mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-foreground transition">About Us</Link></li>
            <li><Link to="/blog" className="hover:text-foreground transition">Blog</Link></li>
            <li><Link to="/contact" className="hover:text-foreground transition">Contact Us</Link></li>
            <li><Link to="/careers" className="hover:text-foreground transition">Careers</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-foreground font-medium mb-3">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/help-center" className="hover:text-foreground transition">Help Center</Link></li>
            <li><Link to="/faq" className="hover:text-foreground transition">FAQ</Link></li>
            <li><Link to="/feedback" className="hover:text-foreground transition">Send Feedback</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-6 text-center text-xs">
        <p>© 2025–2026 Cinematic Lens – A Hadz Group of Companies product. All Rights Reserved.</p>
        <p className="mt-2 text-muted-foreground/60">
          Made with ❤️ in Kampala, Uganda
        </p>
      </div>
    </footer>
  );
}
