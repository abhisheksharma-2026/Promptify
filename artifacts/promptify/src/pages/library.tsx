import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Copy, Trash2, Star, StarOff, Sparkles, Award, Filter, History } from "lucide-react";
import {
  useListPrompts, useDeletePrompt, useAddFavorite, useRemoveFavorite,
  getListPromptsQueryKey, getListFavoritesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import VersionHistoryDrawer from "@/components/version-history-drawer";

const CATEGORIES = ["all", "writing", "marketing", "coding", "business", "trading", "youtube", "education", "design"];

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

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [historyPrompt, setHistoryPrompt] = useState<{ id: number; title: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: prompts, isLoading } = useListPrompts(
    { search: search || undefined, category: category === "all" ? undefined : category },
    { query: { queryKey: getListPromptsQueryKey({ search: search || undefined, category: category === "all" ? undefined : category }) } }
  );
  const deletePrompt = useDeletePrompt();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleDelete = (id: number) => {
    deletePrompt.mutate({ id }, {
      onSuccess: () => {
        toast.success("Prompt deleted");
        queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() });
      },
      onError: () => toast.error("Failed to delete"),
    });
  };

  const handleToggleFavorite = (prompt: { id: number; isFavorited: boolean }) => {
    if (prompt.isFavorited) {
      removeFavorite.mutate({ promptId: prompt.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
        },
      });
    } else {
      addFavorite.mutate({ data: { promptId: prompt.id } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          toast.success("Added to favorites");
        },
      });
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Prompt Library</h1>
          <p className="text-muted-foreground text-sm">Your collection of saved prompts</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-search-prompts"
              placeholder="Search prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-white/10 focus-visible:border-primary/50"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger data-testid="select-filter-category" className="w-full sm:w-44 bg-card border-white/10">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">{c === "all" ? "All Categories" : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Results count */}
        {!isLoading && prompts && (
          <p className="text-xs text-muted-foreground mb-4">{prompts.length} prompt{prompts.length !== 1 ? "s" : ""}</p>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-card p-5">
                <Skeleton className="h-5 w-1/2 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : !prompts?.length ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {search || category !== "all" ? "No matching prompts" : "No saved prompts yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {search || category !== "all" ? "Try different filters" : "Generate and save your first prompt"}
            </p>
            {!search && category === "all" && (
              <Link href="/generate">
                <button className="text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-5 py-2.5 rounded-lg transition-colors">
                  Go to Generator
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {prompts.map((prompt, i) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group rounded-xl border border-white/5 bg-card hover:border-white/10 transition-all"
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === prompt.id ? null : prompt.id)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-medium text-white text-sm leading-snug flex-1">{prompt.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <QualityBadge score={prompt.qualityScore} />
                      <Badge variant="secondary" className="text-xs capitalize bg-white/5 text-muted-foreground border-0">
                        {prompt.category}
                      </Badge>
                    </div>
                  </div>
                  <p className={`text-xs text-muted-foreground font-mono leading-relaxed ${expandedId === prompt.id ? "" : "line-clamp-2"}`}>
                    {prompt.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 px-5 pb-4 border-t border-white/5 pt-3">
                  <span className="text-xs text-muted-foreground flex-1">
                    {new Date(prompt.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    data-testid={`button-history-${prompt.id}`}
                    onClick={() => setHistoryPrompt({ id: prompt.id, title: prompt.title })}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                    title="Version history"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`button-favorite-${prompt.id}`}
                    onClick={() => handleToggleFavorite(prompt)}
                    className={`p-1.5 rounded-lg transition-colors ${prompt.isFavorited ? "text-amber-400 hover:text-amber-300" : "text-muted-foreground hover:text-amber-400"}`}
                  >
                    {prompt.isFavorited ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                  </button>
                  <button
                    data-testid={`button-copy-${prompt.id}`}
                    onClick={() => handleCopy(prompt.content)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`button-delete-${prompt.id}`}
                    onClick={() => handleDelete(prompt.id)}
                    disabled={deletePrompt.isPending}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Version History Drawer */}
      {historyPrompt && (
        <VersionHistoryDrawer
          promptId={historyPrompt.id}
          promptTitle={historyPrompt.title}
          open={!!historyPrompt}
          onClose={() => setHistoryPrompt(null)}
        />
      )}
    </div>
  );
}
