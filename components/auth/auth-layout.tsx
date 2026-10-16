import { Ghost, Network, Users, FileText } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const features = [
  {
    icon: Network,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-base text-copy-primary">
      <aside className="hidden flex-col justify-between bg-surface px-10 py-10 lg:flex lg:w-1/2 xl:px-16">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand">
            <Ghost className="h-4.5 w-4.5 text-base" />
          </div>
          <span className="text-base text-copy-secondary font-semibold tracking-tight">
            Ghost AI
          </span>
        </div>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
              Design systems at the speed of thought.
            </h1>
            <p className="max-w-md text-base leading-relaxed text-copy-secondary">
              Describe your architecture in plain English. Ghost AI maps it to
              a shared canvas your whole team can refine in real time.
            </p>
          </div>
          <ul className="flex flex-col gap-6">
            {features.map((feature) => (
              <li key={feature.title} className="flex items-start gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-elevated">
                  <feature.icon className="h-4.5 w-4.5 text-brand" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{feature.title}</span>
                  <p className="max-w-sm text-sm leading-relaxed text-copy-muted">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-copy-faint">
          © 2026 Ghost AI. All rights reserved.
        </p>
      </aside>
      <main className="flex w-full flex-1 items-center justify-center px-6 py-12 lg:w-1/2">
        {children}
      </main>
    </div>
  );
}
