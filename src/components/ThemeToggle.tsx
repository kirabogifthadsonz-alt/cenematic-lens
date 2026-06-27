import { useTheme } from "@/hooks/useTheme";
import { Sun, Flame } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold">App Theme Color</p>
          <p className="text-xs text-muted-foreground">Switch the accent color across the entire app.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTheme("red")}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all border ${
            theme === "red"
              ? "border-transparent text-white shadow-md"
              : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
          }`}
          style={theme === "red" ? { background: "hsl(357 83% 47%)" } : undefined}
        >
          <Flame className="w-4 h-4" /> Red
        </button>
        <button
          type="button"
          onClick={() => setTheme("yellow")}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all border ${
            theme === "yellow"
              ? "border-transparent shadow-md"
              : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
          }`}
          style={
            theme === "yellow"
              ? { background: "hsl(45 95% 55%)", color: "hsl(0 0% 8%)" }
              : undefined
          }
        >
          <Sun className="w-4 h-4" /> Yellow
        </button>
      </div>
    </div>
  );
}
