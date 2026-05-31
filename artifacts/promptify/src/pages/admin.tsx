import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, FileText, TrendingUp, DollarSign, Star,
  Crown, Globe, IndianRupee, ShieldCheck, Loader2,
  AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Copy, CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminCheck, useAdminOverview, useAdminUsers, useAdminRevenue, useAdminActivity, useMyClerkId } from "@/hooks/use-admin";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const PLAN_COLORS: Record<string, string> = {
  free: "#64748b",
  starter: "#3b82f6",
  pro: "#7c3aed",
  team: "#f59e0b",
  enterprise: "#10b981",
};

const CHART_COLORS = ["#7c3aed", "#3b82f6", "#f59e0b", "#10b981", "#ef4444"];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-border bg-card/50 p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl bg-primary/10 border border-primary/20`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </motion.div>
  );
}

function AccessDenied() {
  const { data: meData } = useMyClerkId();
  const [copied, setCopied] = useState(false);
  const userId: string | null = meData?.userId ?? null;

  const handleCopy = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4">
      <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20">
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        This page is restricted to administrators only. To grant yourself access, set the{" "}
        <code className="text-primary font-mono bg-primary/10 px-1 rounded">ADMIN_USER_ID</code>{" "}
        environment secret to your Clerk user ID below.
      </p>

      {userId && (
        <div className="w-full max-w-md">
          <p className="text-xs text-muted-foreground mb-2 text-center">Your Clerk User ID</p>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
            <code className="flex-1 text-sm font-mono text-foreground truncate">{userId}</code>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={handleCopy}>
              {copied ? (
                <CheckCheck className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Copy this ID → open the <strong className="text-foreground">Secrets</strong> tab in
            Replit → add{" "}
            <code className="text-primary font-mono bg-primary/10 px-1 rounded">ADMIN_USER_ID</code>{" "}
            with this value → restart the API server.
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { data: whoami, isLoading: checkLoading, error: checkError } = useAdminCheck();
  const { data: overview, isLoading: overviewLoading } = useAdminOverview();
  const { data: revenue, isLoading: revenueLoading } = useAdminRevenue();
  const { data: activity, isLoading: activityLoading } = useAdminActivity();
  const [userPage, setUserPage] = useState(0);
  const PAGE_SIZE = 10;
  const { data: usersData, isLoading: usersLoading } = useAdminUsers(PAGE_SIZE, userPage * PAGE_SIZE);
  const queryClient = useQueryClient();

  const isLoading = checkLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (checkError || !whoami) {
    return <AccessDenied />;
  }

  const planDist: any[] = (overview?.planDistribution ?? []).map((r: any) => ({
    name: r.plan?.charAt(0).toUpperCase() + r.plan?.slice(1),
    value: Number(r.user_count),
    fill: PLAN_COLORS[r.plan] ?? "#64748b",
  }));

  const currencyDist: any[] = (overview?.currencyDistribution ?? []).map((r: any) => ({
    name: r.currency?.toUpperCase(),
    value: Number(r.user_count),
  }));

  // Merge prompt + signup activity by day
  const activityMap = new Map<string, { day: string; prompts: number; signups: number }>();
  for (const r of (activity?.promptActivity ?? [])) {
    const day = format(new Date(r.day), "MMM d");
    activityMap.set(day, { day, prompts: Number(r.prompts), signups: 0 });
  }
  for (const r of (activity?.signupActivity ?? [])) {
    const day = format(new Date(r.day), "MMM d");
    const existing = activityMap.get(day) ?? { day, prompts: 0, signups: 0 };
    activityMap.set(day, { ...existing, signups: Number(r.signups) });
  }
  const activityData = Array.from(activityMap.values()).sort(
    (a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()
  );

  const totalPages = Math.ceil((usersData?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Platform overview — visible only to you</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries()}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Total Users"
            value={overviewLoading ? "—" : overview?.totalUsers ?? 0}
            sub={`+${overview?.newUsers7d ?? 0} this week`}
            delay={0}
          />
          <StatCard
            icon={FileText}
            label="Total Prompts"
            value={overviewLoading ? "—" : overview?.totalPrompts ?? 0}
            sub={`+${overview?.newPrompts7d ?? 0} this week`}
            color="text-blue-400"
            delay={0.06}
          />
          <StatCard
            icon={Crown}
            label="Paid Users"
            value={overviewLoading ? "—" : overview?.paidUsers ?? 0}
            sub={
              overview
                ? `${Math.round((overview.paidUsers / Math.max(overview.totalUsers, 1)) * 100)}% conversion`
                : ""
            }
            color="text-amber-400"
            delay={0.12}
          />
          <StatCard
            icon={Star}
            label="Total Favorites"
            value={overviewLoading ? "—" : overview?.totalFavorites ?? 0}
            color="text-pink-400"
            delay={0.18}
          />
        </div>

        {/* Revenue Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="rounded-2xl border border-border bg-card/50 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-foreground">USD MRR</span>
              <span className="text-xs text-muted-foreground ml-auto">via Stripe</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {revenueLoading ? "—" : `$${(revenue?.usdMrr ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {revenue?.stripeSubscriptions ?? 0} active Stripe subscriptions
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.30 }}
            className="rounded-2xl border border-border bg-card/50 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <IndianRupee className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-foreground">INR MRR</span>
              <span className="text-xs text-muted-foreground ml-auto">via Razorpay</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {revenueLoading ? "—" : `₹${(revenue?.inrMrr ?? 0).toLocaleString("en-IN")}`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Indian market revenue</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            className="rounded-2xl border border-border bg-card/50 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-foreground">Market Split</span>
            </div>
            <div className="flex gap-4 mt-2">
              {currencyDist.map((c, i) => (
                <div key={c.name} className="flex flex-col">
                  <span className="text-xl font-bold text-foreground">{c.value}</span>
                  <span className="text-xs text-muted-foreground">{c.name} users</span>
                </div>
              ))}
              {currencyDist.length === 0 && (
                <span className="text-sm text-muted-foreground">No data yet</span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Activity chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 rounded-2xl border border-border bg-card/50 p-5"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">Activity — last 30 days</h3>
            {activityLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : activityData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No activity data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={activityData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="prompts"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={false}
                    name="Prompts"
                  />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Signups"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Plan distribution pie */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46 }}
            className="rounded-2xl border border-border bg-card/50 p-5"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">Plan Distribution</h3>
            {overviewLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : planDist.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No users yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={planDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {planDist.map((entry, i) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {planDist.map((p) => (
                    <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: p.fill }}
                      />
                      {p.name} ({p.value})
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Users table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="rounded-2xl border border-border bg-card/50 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Users{usersData ? ` (${usersData.total})` : ""}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={userPage === 0}
                onClick={() => setUserPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {userPage + 1} / {Math.max(1, totalPages)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={userPage + 1 >= totalPages}
                onClick={() => setUserPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4">Email</th>
                    <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4">Plan</th>
                    <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4">Currency</th>
                    <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4">Prompts</th>
                    <th className="text-left text-xs text-muted-foreground font-medium pb-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(usersData?.users ?? []).map((user: any) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/50 hover:bg-white/2 transition-colors"
                    >
                      <td className="py-2.5 pr-4 text-foreground max-w-[180px] truncate">
                        {user.email ?? (
                          <span className="text-muted-foreground text-xs font-mono">
                            {user.id.slice(0, 16)}…
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: (PLAN_COLORS[user.plan] ?? "#64748b") + "22",
                            color: PLAN_COLORS[user.plan] ?? "#64748b",
                          }}
                        >
                          {user.plan?.charAt(0).toUpperCase() + user.plan?.slice(1)}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground text-xs uppercase">
                        {user.currency === "inr" ? "🇮🇳 INR" : "🌍 USD"}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                        {user.prompt_count ?? 0}
                      </td>
                      <td className="py-2.5 text-muted-foreground text-xs">
                        {user.created_at
                          ? format(new Date(user.created_at), "MMM d, yyyy")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {(usersData?.users ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
