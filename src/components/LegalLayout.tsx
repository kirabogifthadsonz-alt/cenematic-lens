import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "./Footer";

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  updated?: string;
  children: ReactNode;
}

export default function LegalLayout({ title, subtitle, updated = "Updated June 2026", children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header
        className="px-6 pt-6 pb-4 border-b border-border"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        <div className="max-w-4xl mx-auto">
          <Link to="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            <span style={{ color: "#FFC72C" }}>{title.split(" ")[0]}</span>{" "}
            <span style={{ color: "#E50914" }}>{title.split(" ").slice(1).join(" ")}</span>
          </h1>
          {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
          <p className="mt-2 text-xs text-muted-foreground/60">{updated}</p>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <article className="max-w-4xl mx-auto prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary max-w-none space-y-6 leading-relaxed">
          {children}
        </article>
      </main>

      <Footer />
    </div>
  );
}
