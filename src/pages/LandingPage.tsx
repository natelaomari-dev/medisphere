import { Brain, ArrowRight, Shield, Zap, Activity, Users, BarChart3, Sparkles, Globe, Heart, Building2, ChevronRight, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroDashboard from "@/assets/hero-dashboard.jpg";

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const features = [
  { icon: Brain, title: "AI Hospital Brain", desc: "Central intelligence engine that continuously analyzes patient records, lab results, and hospital capacity to generate smart alerts and risk predictions." },
  { icon: Sparkles, title: "Smart Triage", desc: "AI-powered symptom assessment with automatic risk classification, queue prioritization, and emergency detection in real-time." },
  { icon: Activity, title: "Predictive Patient Care", desc: "Detect deterioration, sepsis risk, ICU transfer probability, and readmission risk before they happen with early warning alerts." },
  { icon: Shield, title: "Enterprise Security", desc: "Role-based access, end-to-end encryption, audit trails, and multi-factor authentication built for healthcare compliance." },
  { icon: BarChart3, title: "Command Center", desc: "Real-time hospital operations dashboard with bed occupancy, ER wait times, lab turnaround, and staff workload in one view." },
  { icon: Globe, title: "Africa-First Design", desc: "Offline-first, WhatsApp integration, mobile money payments, and low-bandwidth optimization for African healthcare." },
];

const stats = [
  { value: "87%", label: "Reduction in admin time" },
  { value: "4.2x", label: "Faster triage decisions" },
  { value: "93%", label: "Sepsis detection accuracy" },
  { value: "12hr", label: "Earlier risk prediction" },
];

const modules = [
  "Dashboard", "Patients", "Appointments", "Doctors", "Nurses", "Laboratory",
  "Pharmacy", "Billing", "Inventory", "Inpatients", "ICU Monitoring", "Telemedicine",
  "AI Insights", "Smart Triage", "MOH Reports", "Insurance Claims",
];

const pricingPlans = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    desc: "For small clinics getting started",
    highlight: false,
    features: [
      { text: "Up to 5 staff users", included: true },
      { text: "100 patient records", included: true },
      { text: "Basic dashboard", included: true },
      { text: "Appointments & scheduling", included: true },
      { text: "AI Insights", included: false },
      { text: "Smart Triage", included: false },
      { text: "ICU Monitoring", included: false },
      { text: "MOH Reports", included: false },
    ],
  },
  {
    name: "Basic",
    price: "4,999",
    period: "/month",
    desc: "For growing clinics and dispensaries",
    highlight: false,
    features: [
      { text: "Up to 15 staff users", included: true },
      { text: "1,000 patient records", included: true },
      { text: "Full EMR & billing", included: true },
      { text: "Laboratory & pharmacy", included: true },
      { text: "Basic AI Insights", included: true },
      { text: "Smart Triage", included: false },
      { text: "ICU Monitoring", included: false },
      { text: "MOH Reports", included: false },
    ],
  },
  {
    name: "Professional",
    price: "14,999",
    period: "/month",
    desc: "For sub-county and district hospitals",
    highlight: true,
    features: [
      { text: "Up to 50 staff users", included: true },
      { text: "Unlimited patients", included: true },
      { text: "Full EMR, billing & inpatient", included: true },
      { text: "AI Insights & Smart Triage", included: true },
      { text: "ICU Monitoring", included: true },
      { text: "Insurance claims (SHA)", included: true },
      { text: "MOH Reports (705, 711)", included: true },
      { text: "Telemedicine", included: true },
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For county referral & teaching hospitals",
    highlight: false,
    features: [
      { text: "Unlimited staff users", included: true },
      { text: "Unlimited patients", included: true },
      { text: "All modules included", included: true },
      { text: "Advanced AI & analytics", included: true },
      { text: "Multi-branch support", included: true },
      { text: "Custom integrations", included: true },
      { text: "Dedicated support & SLA", included: true },
      { text: "On-premise option", included: true },
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">MediSphere AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#modules" className="hover:text-foreground transition-colors">Modules</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Impact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/auth" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" /> AI-Powered Hospital Intelligence
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.1] mb-6">
              The future of hospital management is{" "}
              <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">intelligent</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-8">
              MediSphere AI combines hospital operations, clinical intelligence, and predictive analytics into one platform. Reduce admin work, predict patient risks, and optimize your hospital automatically.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/auth" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                Start Free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors">
                See Features
              </a>
            </div>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="mt-16 rounded-xl overflow-hidden border border-border shadow-2xl shadow-primary/5">
            <img src={heroDashboard} alt="MediSphere AI Hospital Command Center Dashboard" className="w-full" loading="lazy" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 px-6 border-y border-border bg-muted/20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.05 }} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              Intelligence at every layer
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From triage to discharge, MediSphere AI automates decisions and surfaces insights that save lives.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.05 }}
                className="group p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="py-24 px-6 bg-muted/20 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              16+ integrated modules
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every department connected. Every workflow automated. One unified platform.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="flex flex-wrap justify-center gap-3">
            {modules.map((mod) => (
              <span key={mod} className="px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-default">
                {mod}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From rural dispensaries to national referral hospitals. Pay only for what you need, scale as you grow.
            </p>
            <p className="text-xs text-muted-foreground mt-2">Prices shown in KES. Equivalent pricing available in UGX, TZS, RWF and other East African currencies. 14-day free trial on all paid plans.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                {...fadeUp}
                transition={{ delay: i * 0.05 }}
                className={`relative rounded-xl border p-6 flex flex-col ${
                  plan.highlight
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-foreground mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    {plan.price === "Custom" ? (
                      <span className="text-2xl font-bold text-foreground">Custom</span>
                    ) : (
                      <>
                        <span className="text-xs text-muted-foreground">KES</span>
                        <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                        <span className="text-xs text-muted-foreground">{plan.period}</span>
                      </>
                    )}
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-xs">
                      {f.included ? (
                        <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                      )}
                      <span className={f.included ? "text-foreground" : "text-muted-foreground/60"}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/auth"
                  className={`w-full text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {plan.price === "Custom" ? "Contact Sales" : plan.price === "0" ? "Get Started Free" : "Start Free Trial"}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Africa Section */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-background p-10 md:p-16 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium mb-4">
                <Globe className="h-3.5 w-3.5" /> Africa-First Innovation
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
                Built for East African healthcare
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Offline-first architecture, WhatsApp patient communication, mobile money payments (M-Pesa, MTN MoMo, Airtel Money, Tigo Pesa), community health worker interfaces, and rural clinic support across Kenya, Uganda, Tanzania, Rwanda and beyond. Works even with low bandwidth.
              </p>
              <div className="space-y-3">
                {["Multi-country & multi-currency (KES, UGX, TZS, RWF…)", "Offline-first functionality", "WhatsApp triage & reminders", "Mobile money (M-Pesa, MTN MoMo, Airtel Money)", "Low-bandwidth optimized"].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <Heart className="h-4 w-4 text-success shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="h-48 w-48 md:h-64 md:w-64 rounded-2xl bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center shrink-0">
              <Building2 className="h-20 w-20 text-primary/30" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-border">
        <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
            Ready to transform your hospital?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join hospitals across Africa using AI to save lives, reduce costs, and deliver world-class care.
          </p>
          <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-medium text-lg hover:bg-primary/90 transition-colors">
            Get Started Free <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Brain className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold text-foreground">MediSphere AI</span>
            <span className="text-[10px] text-muted-foreground">by Infera Tech Solutions</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Infera Tech Solutions. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
