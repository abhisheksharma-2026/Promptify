import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Sparkles, Star, Copy, TrendingUp, Calendar, Award, ArrowRight, Clock
} from "lucide-react";
import {
  useGetDashboardStats,
  useGetTrendingPrompts,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/react";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

// सुधरा हुआ StatCard - अब लोडिंग के समय यह काला डिब्बा नहीं दिखाएगा
function StatCard({ label, value, icon: Icon, color, suffix = "", isLoading }: {
  label: string; value: number | string | null | undefined; icon: React.ElementType;
  color: string; suffix?: string; isLoading?: boolean;
}) {
  return (
    <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-white/5 bg-card p-6 backdrop-blur-sm shadow-sm transition-all duration-300 hover:border-white/10">
      <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${color}`} />
      <div className="relative">
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 bg-gradient-to-br ${color} opacity-90`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-3xl font-bold text-white mb-1 tracking-tight">
          {isLoading || value == null ? (
            // bg-white/10 जोड़ा गया है ताकि डार्क मोड में लोडिंग स्टेट साफ दिखाई दे
            <Skeleton className="h-9 w-16 bg-white/10 animate-pulse rounded-md" />
          ) : (
            `${value}${suffix}`
          )}
        </div>
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
      </div>
    </motion.div>
  );
}

function QualityBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return null;
  const color = score >= 8 ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
    : score >= 5 ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
    : "text-red-400 bg-red-400/10 border-red-400/20";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      <Award className="w-3 h-3" />{score}/10
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const { data: stats, isLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() },
  });
  const { data: trending } = useGetTrendingPrompts();

  const handleCopy = (content: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const firstName = user?.firstName || user?.username || "there";

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Here's your prompt engineering overview</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={container} initial="hidden" animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatCard label="Total Prompts" value={stats?.totalPrompts} icon={Sparkles} color="from-purple-500 to-violet-600" isLoading={isLoading} />
          <StatCard label="Favorites" value={stats?.totalFavorites} icon={Star} color="from-amber-500 to-orange-500" isLoading={isLoading} />
          <StatCard label="Total Copies" value={stats?.totalCopies} icon={Copy} color="from-blue-500 to-cyan-500" isLoading={isLoading} />
          <StatCard label="This Week" value={stats?.promptsThisWeek} icon={Calendar} color="from-emerald-500 to-teal-500" isLoading={isLoading} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Prompts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Prompts</h2>
              <Link href="/library" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-white/5 bg-card p-4">
                    <Skeleton className="h-5 w-3/4 mb-2 bg-white/10" />
                    <Skeleton className="h-4 w-full mb-1 bg-white/10" />
                    <Skeleton className="h-4 w-2/3 bg-white/10" />
                  </div>
                ))
              ) : !stats?.recentPrompts?.length ? (
                <div className="rounded-xl border border-white/5 bg-card p-8 text-center bg-card/50">
                  <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm mb-4">No prompts yet. Start generating!</p>
                  <Link href="/generate">
                    <button className="text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2 rounded-lg transition-colors cursor-pointer">
                      Generate your first prompt
                    </button>
                  </Link>
                </div>
              ) : (
                stats.recentPrompts.map((prompt, i) => (
                  <motion.div
                    key={prompt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="group rounded-xl border border-white/5 bg-card hover:border-white/10 p-4 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-medium text-white text-sm truncate flex-1">{prompt.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <QualityBadge score={prompt.qualityScore} />
                        <Badge variant="secondary" className="text-xs capitalize bg-white/5 text-muted-foreground border-0">
                          {prompt.category}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{prompt.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(prompt.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        data-testid={`copy-prompt-${prompt.id}`}
                        onClick={() => handleCopy(prompt.content)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-all cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Trending + Stats Sidebar */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4 }}
  className="space-y-6"
>
  {/* Quick stats / Insights */}
  {(stats?.topCategory || stats?.avgQualityScore) && (
    <div className="rounded-xl border border-white/5 bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">Your Insights</h3>
      {stats?.topCategory && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Top category</span>
          <Badge variant="secondary" className="text-xs capitalize bg-primary/10 text-primary border-0">
            {stats.topCategory}
          </Badge>
        </div>
      )}
      {stats?.avgQualityScore && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Avg quality</span>
          <QualityBadge score={stats.avgQualityScore} />
        </div>
      )}
    </div>
  )}

  {/* Trending Section */}
  <div>
    <div className="flex items-center gap-2 mb-3">
      <TrendingUp className="w-4 h-4 text-primary" />
      <h2 className="text-sm font-semibold text-white">Trending Prompts</h2>
    </div>
    <div className="space-y-2">
      {!trending?.length ? (
        <div className="rounded-xl border border-white/5 bg-card/30 p-4 text-center">
          <p className="text-xs text-muted-foreground">No trending prompts yet.</p>
        </div>
      ) : (
        trending.slice(0, 5).map((p, i) => (
          <div
            key={p.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-card hover:border-white/10 transition-all cursor-pointer group"
            onClick={() => handleCopy(p.content)}
          >
            {/* सीरियल नंबर (01, 02 आदि) */}
            <span className="text-xs font-bold text-primary/40 w-4 flex-shrink-0 mt-0.5">
              {String(i + 1).padStart(2, '0')}
            </span>
            
            {/* प्रॉम्प्ट की डिटेल्स */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{p.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Copy className="w-2.5 h-2.5" /> {p.copyCount}
                </span>
                <Badge variant="secondary" className="text-xs capitalize bg-white/5 text-muted-foreground border-0 px-1.5 py-0">
                  {p.category}
                </Badge>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>

  {/* Bottom CTA Card */}
  <Link href="/generate">
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-xl bg-gradient-to-br from-primary/20 to-purple-900/30 border border-primary/20 p-5 cursor-pointer group"
    >
      <Sparkles className="w-6 h-6 text-primary mb-2 transition-transform group-hover:rotate-12" />
      <p className="text-sm font-semibold text-white mb-1">Generate a prompt</p>
      <p className="text-xs text-muted-foreground">Type one idea, get an expert-level prompt</p>
    </motion.div>
  </Link>
</motion.div>
