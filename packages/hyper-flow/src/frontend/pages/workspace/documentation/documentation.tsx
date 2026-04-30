import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  FileText,
  Zap,
  Globe,
  ArrowRight,
  Terminal,
  BookOpen,
  Code2,
  Layers,
  Sparkles,
  Shield,
  RefreshCw,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";
import { DotPattern } from "@/components/ui/dot-pattern";
import { useWorkspaces } from "@/store/workspace/workspaces.store";
import { EmptyState } from "@/components/no-content/empty-state";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const steps = [
  {
    step: "01",
    icon: Terminal,
    title: "Point to your schema",
    description: "Connect your OpenAPI, Swagger, or GraphQL schema. One command, zero config.",
    visual: (
      <div className="font-mono text-xs leading-relaxed">
        <span className="text-zinc-500">$</span> <span className="text-yellow-400">npx</span>{" "}
        <span className="text-zinc-300">hyper-fetch generate</span>
        <br />
        <span className="text-zinc-600"> ↳ schema detected: openapi@3.1</span>
        <br />
        <span className="text-zinc-600"> ↳ endpoints: 47 found</span>
        <br />
        <span className="text-green-400"> ✓ SDK generated in 1.2s</span>
      </div>
    ),
    gradient: "from-yellow-500/20 to-orange-500/20",
    accentColor: "text-yellow-400",
    borderColor: "border-yellow-500/20",
    beamColor: "#eab308",
  },
  {
    step: "02",
    icon: Code2,
    title: "Fully typed SDK is ready",
    description: "Every endpoint, param, and response — typed. Autocompletion that actually works.",
    visual: (
      <div className="font-mono text-xs leading-relaxed">
        <span className="text-zinc-500">{"// "}</span>
        <span className="text-zinc-600">Zero guesswork</span>
        <br />
        <span className="text-blue-400">const</span> <span className="text-zinc-300">user</span>{" "}
        <span className="text-zinc-500">=</span> <span className="text-blue-400">await</span>{" "}
        <span className="text-yellow-300">getUser</span>
        <br />
        {"  "}.<span className="text-green-300">setParams</span>
        {"({ "}
        <span className="text-orange-300">userId</span>: <span className="text-yellow-200">123</span>
        {" })"}
        <br />
        {"  "}.<span className="text-green-300">send</span>()
        <br />
        <br />
        <span className="text-zinc-300">user</span>.<span className="text-green-300">data</span>.
        <span className="text-zinc-400 animate-pulse">|</span>
        <span className="text-zinc-600"> ← autocomplete</span>
      </div>
    ),
    gradient: "from-blue-500/20 to-cyan-500/20",
    accentColor: "text-blue-400",
    borderColor: "border-blue-500/20",
    beamColor: "#3b82f6",
  },
  {
    step: "03",
    icon: BookOpen,
    title: "Docs generate themselves",
    description: "Interactive API reference, request examples, and type definitions — all auto-generated.",
    visual: (
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-mono text-[10px]">GET</span>
          <span className="text-zinc-400 font-mono">/api/users/:id</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px]">POST</span>
          <span className="text-zinc-400 font-mono">/api/users</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-mono text-[10px]">PUT</span>
          <span className="text-zinc-400 font-mono">/api/users/:id</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono text-[10px]">DELETE</span>
          <span className="text-zinc-400 font-mono">/api/users/:id</span>
        </div>
      </div>
    ),
    gradient: "from-emerald-500/20 to-green-500/20",
    accentColor: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    beamColor: "#10b981",
  },
];

const capabilities = [
  {
    icon: Zap,
    title: "Instant generation",
    stat: "< 2s",
    description: "Full SDK from schema in under two seconds. No waiting.",
  },
  {
    icon: Shield,
    title: "Zero any types",
    stat: "100%",
    description: "Every response, every param, every error — fully typed. No escape hatches.",
  },
  {
    icon: Globe,
    title: "Any API protocol",
    stat: "5+",
    description: "REST, GraphQL, Firebase, WebSockets, SSE — one interface for all.",
  },
  {
    icon: RefreshCw,
    title: "Always in sync",
    stat: "Auto",
    description: "Schema changes? Regenerate. Types update across your entire codebase.",
  },
];

const comparisons = [
  { label: "Writing types manually", time: "Hours", yours: true },
  { label: "Keeping docs updated", time: "Days", yours: true },
  { label: "Onboarding new devs", time: "Weeks", yours: true },
  { label: "Finding the right endpoint", time: "Minutes", yours: true },
];

export const WorkspaceDocumentation = () => {
  const workspaceId = "1";
  const navigate = useNavigate();
  const { workspaces } = useWorkspaces();

  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    return (
      <EmptyState title="Workspace not found" description="Please create a workspace first">
        <Button onClick={() => navigate({ to: "/" })}>Create Workspace</Button>
      </EmptyState>
    );
  }

  return (
    <div className="relative w-full overflow-y-auto overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-24">
        {/* Hero Section */}
        <motion.section
          className="relative text-center space-y-6"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <Badge variant="secondary" className="mb-4 text-yellow-400 border-yellow-500/30">
              <Sparkles className="size-3" />
              Auto-generated from your schema
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-200 to-zinc-500"
          >
            Your API docs write
            <br />
            themselves.
          </motion.h1>

          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-lg text-zinc-400 max-w-xl mx-auto">
            Point HyperFetch at your schema. Get a fully typed SDK with interactive docs, request examples, and type
            definitions — in seconds, not sprints.
          </motion.p>

          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex justify-center gap-3 pt-2">
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-zinc-900 font-semibold hover:from-yellow-400 hover:to-orange-400">
              Generate SDK
              <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <FileText className="size-4 mr-1" />
              View example
            </Button>
          </motion.div>
        </motion.section>

        {/* How It Works - Numbered Steps */}
        <motion.section
          className="space-y-6"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="text-center space-y-3 mb-12">
            <p className="text-sm font-medium text-yellow-400 tracking-wide uppercase">How it works</p>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-100">
              Three steps. Zero boilerplate.
            </h2>
          </motion.div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div
                  className={cn(
                    "relative rounded-xl border border-zinc-800/80 bg-gradient-to-br overflow-hidden",
                    "hover:border-zinc-700/80 transition-all duration-500",
                    step.gradient,
                  )}
                >
                  <div className="relative grid md:grid-cols-[1fr_280px] gap-6 p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className={cn("font-mono text-2xl font-bold tracking-tight", step.accentColor)}>
                          {step.step}
                        </span>
                        <div
                          className={cn(
                            "size-9 rounded-lg flex items-center justify-center border",
                            step.borderColor,
                            "bg-zinc-900/60",
                          )}
                        >
                          <step.icon className={cn("size-4", step.accentColor)} />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-zinc-100">{step.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed max-w-md">{step.description}</p>
                    </div>

                    <div className="hidden md:flex items-center">
                      <div className="w-full rounded-lg bg-zinc-950/80 border border-zinc-800/60 p-4 backdrop-blur-sm">
                        {step.visual}
                      </div>
                    </div>
                  </div>

                  <BorderBeam
                    size={120}
                    duration={8 + index * 2}
                    colorFrom={step.beamColor}
                    colorTo="transparent"
                    delay={index * 2}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Capabilities Grid */}
        <motion.section
          className="space-y-6"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="text-center space-y-3 mb-10">
            <p className="text-sm font-medium text-yellow-400 tracking-wide uppercase">By the numbers</p>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-100">
              Built for teams that ship fast
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {capabilities.map((cap, index) => (
              <motion.div key={cap.title} variants={fadeUp} transition={{ duration: 0.5, delay: index * 0.08 }}>
                <Card className="relative group border-zinc-800/80 hover:border-zinc-700/60 transition-all duration-500 h-full">
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center justify-between">
                      <div className="size-10 rounded-lg bg-zinc-800/80 flex items-center justify-center group-hover:bg-zinc-700/80 transition-colors">
                        <cap.icon className="size-5 text-yellow-400" />
                      </div>
                      <span className="text-2xl font-bold font-mono text-zinc-100 tracking-tight">{cap.stat}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-200">{cap.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{cap.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* FOMO Section - Time comparison */}
        <motion.section
          className="relative"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          <div className="relative rounded-2xl border border-zinc-800/60 overflow-hidden">
            <DotPattern className="text-zinc-700/40" width={24} height={24} cr={0.8} />

            <div className="relative p-8 md:p-10 space-y-8">
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="text-center space-y-3">
                <p className="text-sm font-medium text-red-400/80 tracking-wide uppercase">Without HyperFetch</p>
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-100">
                  Your team is wasting time on things
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
                    that should be automated.
                  </span>
                </h2>
              </motion.div>

              <div className="space-y-2">
                {comparisons.map((item, index) => (
                  <motion.div
                    key={item.label}
                    variants={fadeUp}
                    transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-zinc-900/40 border border-zinc-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="size-4 text-zinc-600" />
                      <span className="text-sm text-zinc-300">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-red-400/70 line-through">{item.time}</span>
                      <ArrowRight className="size-3 text-zinc-600" />
                      <Badge variant="success" className="font-mono text-[11px]">
                        0
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="text-center pt-4">
                <p className="text-zinc-500 text-sm">
                  The best API layer is the one your team{" "}
                  <span className="text-zinc-300">never has to think about.</span>
                </p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Bottom CTA */}
        <motion.section
          className="text-center space-y-6 pb-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.5 }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <div className="relative inline-block">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
                <Layers className="size-7 text-yellow-400" />
              </div>
            </div>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold text-zinc-100"
          >
            Ready to generate your SDK?
          </motion.h2>

          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-zinc-400 max-w-md mx-auto">
            Connect your schema and get a fully typed, documented API layer. Your future self will thank you.
          </motion.p>

          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex justify-center gap-3">
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-zinc-900 font-semibold hover:from-yellow-400 hover:to-orange-400">
              Get started
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
};
