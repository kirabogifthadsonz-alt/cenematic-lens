import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GoogleAuthButtonProps {
  loading?: boolean;
  onClick: () => void | Promise<void>;
  className?: string;
}

export function GoogleAuthButton({ loading = false, onClick, className }: GoogleAuthButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={onClick}
      className={cn(
        "h-12 w-full justify-center rounded-xl border-border/80 bg-secondary/45 text-foreground hover:bg-secondary hover:text-foreground",
        className,
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-background/85 text-sm font-bold text-foreground shadow-sm shadow-background/30">
        G
      </span>
      <span>{loading ? "Connecting to Google..." : "Continue with Google"}</span>
    </Button>
  );
}
