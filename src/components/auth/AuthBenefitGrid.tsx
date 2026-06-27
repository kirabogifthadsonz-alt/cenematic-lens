import { Film, Mic, Star } from "lucide-react";

const benefits = [
  {
    icon: Film,
    title: "Affordable Pay-Per-View",
    desc: "Watch what you love at prices that work for you. No monthly subscription needed.",
  },
  {
    icon: Mic,
    title: "Luganda VJ Narrations",
    desc: "Enjoy movies narrated by Uganda's top VJs — Emmy, Junior, ICP, and more.",
  },
  {
    icon: Star,
    title: "Real Ugandan Originals",
    desc: "Ugawood hits, local series, and Cinematic Lens originals made in Kampala.",
  },
];

export function AuthBenefitGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
      {benefits.map(({ icon: Icon, title, desc }) => (
        <div
          key={title}
          className="rounded-[calc(var(--radius)*2)] border border-border/70 bg-card/75 p-6 text-center shadow-lg shadow-background/20 backdrop-blur-sm transition-colors hover:border-primary/40"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </div>
          <h3 className="mb-2 text-lg text-foreground">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{desc}</p>
        </div>
      ))}
    </div>
  );
}
