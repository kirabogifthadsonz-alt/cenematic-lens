import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import logoSquare from "@/assets/logo-square.jpg";

interface AuthPanelProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthPanel({
  eyebrow = "Movies, streamed your way",
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[calc(var(--radius)*3)] border border-border/80 bg-card/95 shadow-2xl shadow-background/40 backdrop-blur-xl",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.28),transparent_38%)]" />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-br from-primary via-primary/85 to-background" />

      <div className="relative">
        <div className="border-b border-border/80 px-6 pb-6 pt-7 sm:px-8">
          <div className="mb-5 inline-flex items-center rounded-full border border-primary-foreground/15 bg-background/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary-foreground/90 backdrop-blur-sm">
            Cinematic Lens
          </div>

          <div className="mb-5 flex items-center gap-4">
            <img
              src={logoSquare}
              alt="Cinematic Lens"
              className="h-16 w-16 rounded-2xl border border-primary-foreground/15 object-cover shadow-lg shadow-background/30"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-4xl leading-none text-primary-foreground sm:text-5xl">
                {title}
              </h1>
            </div>
          </div>

          <p className="max-w-md text-sm leading-6 text-primary-foreground/80 sm:text-base">
            {subtitle}
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8">{children}</div>

        {footer ? (
          <div className="border-t border-border/80 px-6 py-4 text-xs text-muted-foreground sm:px-8">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
