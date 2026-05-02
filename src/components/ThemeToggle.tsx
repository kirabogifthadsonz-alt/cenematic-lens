import { Palette } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const next = theme === "yellow" ? "Red" : "Yellow";
  return (
    <button
      onClick={toggle}
      title={`Switch to ${next} theme`}
      aria-label={`Switch to ${next} theme`}
      className={`flex items-center gap-1.5 rounded-full border border-border bg-card/60 hover:bg-card px-2.5 py-1 text-xs font-medium text-foreground transition ${className}`}
    >
      <Palette className="w-3.5 h-3.5 text-primary" />
      <span className="hidden md:inline capitalize">{theme}</span>
    </button>
  );
}
