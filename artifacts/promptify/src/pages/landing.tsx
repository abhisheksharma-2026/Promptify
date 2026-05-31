import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, BrainCircuit, Target, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-transparent blur-[100px] rounded-full" />
      </div>
      
      <main className="container mx-auto px-4 md:px-6 pt-24 pb-32">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center max-w-4xl mx-auto mb-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>The Grammarly of Prompt Engineering</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6"
          >
            Transform vague ideas into <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">expert-level prompts.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground mb-10 max-w-2xl"
          >
            Stop wrestling with AI to get what you want. Promptify uses the APEX framework to automatically optimize your instructions, saving you hours of trial and error.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link href="/sign-up">
              <Button size="lg" className="h-14 px-8 text-base bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_-5px_rgba(147,51,234,0.5)] rounded-full">
                Start Crafting Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/templates">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-border/50 bg-white/5 hover:bg-white/10 backdrop-blur-sm">
                Browse Templates
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Demo UI Mockup Section */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative max-w-5xl mx-auto mb-32"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-2xl blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-black/40">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Before</div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-slate-300 font-mono text-sm h-32">
                  "write a blog post about artificial intelligence for marketing"
                </div>
              </div>
              <div className="space-y-4 relative">
                <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary z-10 border border-primary/30">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-primary font-medium uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> After (APEX Optimized)
                  </div>
                  <div className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/20">
                    Quality: 9.8
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-slate-200 font-mono text-sm leading-relaxed h-auto shadow-[inset_0_0_20px_rgba(147,51,234,0.05)]">
                  <span className="text-blue-400">Act as</span> an expert B2B content marketer.<br/><br/>
                  <span className="text-blue-400">Purpose:</span> Write a 1,500-word comprehensive blog post analyzing the impact of generative AI on digital marketing workflows.<br/><br/>
                  <span className="text-blue-400">Expectations:</span> Include 3 concrete use cases, address common security concerns, and provide actionable takeaways for CMOs.<br/><br/>
                  <span className="text-blue-400">Format:</span> Professional yet accessible tone, optimized for SEO with H2/H3 tags and short paragraphs.
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Features Grid */}
        <section className="py-20 border-t border-white/5 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Engineering precision, zero effort.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to build, organize, and execute complex prompts consistently.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-yellow-400" />}
              title="Real-time Streaming"
              description="Watch your prompt evolve instantly token-by-token. No loading spinners, just immediate results."
            />
            <FeatureCard 
              icon={<Target className="w-6 h-6 text-green-400" />}
              title="Quality Scoring"
              description="Our proprietary AI scores your prompts based on clarity, specificity, and expected outcome accuracy."
            />
            <FeatureCard 
              icon={<BrainCircuit className="w-6 h-6 text-blue-400" />}
              title="Smart Iterations"
              description="One-click buttons to make your prompt more concise, add examples, or change the target audience."
            />
          </div>
        </section>

      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group hover:bg-white/[0.02]">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}