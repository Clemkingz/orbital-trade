import { ArrowRight, BadgeCheck, Landmark, LockKeyhole, PlayCircle } from "lucide-react";
import { ButtonLink } from "@orbit/ui/components/ui/Button";
import { BotWidget } from "./BotWidget";

const BADGES = [
  { icon: BadgeCheck, label: "ID-verified accounts" },
  { icon: Landmark, label: "Licensed custody" },
  { icon: LockKeyhole, label: "2FA on every withdrawal" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-night pb-14 pt-28 text-white sm:pt-32 lg:pb-20 lg:pt-36">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-48 right-[-10%] size-[620px] animate-glow rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-[-30%] left-[-10%] size-[560px] animate-glow rounded-full bg-primary/25 blur-3xl" style={{ animationDelay: "-2s" }} />
        <div className="absolute left-1/3 top-1/4 size-72 animate-glow rounded-full bg-magenta/10 blur-3xl" style={{ animationDelay: "-4s" }} />
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-8">
        <div className="text-center lg:text-left">
          <span className="inline-flex animate-rise items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
            <span className="rounded-full bg-cyan px-1.5 py-0.5 text-[10px] font-bold text-night">NEW</span>
            Copy multiple traders at once
          </span>
          <h1 className="mt-6 animate-rise text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl" style={{ animationDelay: "60ms" }}>
            Trade Bitcoin with traders <span className="bg-gradient-to-r from-cyan to-sky bg-clip-text text-transparent">you can verify.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl animate-rise text-lg text-white/70 lg:mx-0" style={{ animationDelay: "120ms" }}>
            Buy BTC on a trusted platform, verify your ID, and copy vetted traders. Their wins and losses come from recorded trades, never typed-in numbers.
          </p>
          <div className="mt-8 flex animate-rise flex-col justify-center gap-3 sm:flex-row lg:justify-start" style={{ animationDelay: "180ms" }}>
            <ButtonLink href="/sign-up" className="group">
              Get started <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="outline-light" icon={<PlayCircle className="size-4" />}>
              See how it works
            </ButtonLink>
          </div>
          <ul className="mt-10 flex animate-rise flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-white/60 lg:justify-start" style={{ animationDelay: "240ms" }}>
            {BADGES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-4 text-cyan" /> {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative animate-rise" style={{ animationDelay: "200ms" }}>
          <div className="absolute -inset-6 -z-10 rounded-[32px] bg-gradient-to-br from-primary/30 via-transparent to-magenta/20 blur-2xl" aria-hidden="true" />
          <BotWidget />
        </div>
      </div>
    </section>
  );
}
