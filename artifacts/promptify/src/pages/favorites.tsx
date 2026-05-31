import { motion } from "framer-motion";
import { Star, Copy, StarOff, Sparkles, Award } from "lucide-react";
import {
  useListFavorites, useRemoveFavorite,
  getListFavoritesQueryKey, getListPromptsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

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

export default function FavoritesPage() {
  const queryClient = useQueryClient();
  const { data: favorites, isLoading } = useListFavorites({
    query: { queryKey: getListFavoritesQueryKey() },
  });
  const removeFavorite = useRemoveFavorite();

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleRemove = (promptId: number) => {
    removeFavorite.mutate({ promptId }, {
      onSuccess: () => {
        toast.success("Removed from favorites");
        queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() });
      },
    });
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h1 className="text-2xl font-bold text-white">Favorites</h1>
          </div>
          <p className="text-muted-foreground text-sm">Your bookmarked prompts</p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-card p-5">
                <Skeleton className="h-5 w-1/2 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : !favorites?.length ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto mb-4">
              <Star className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No favorites yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Star prompts from your library to bookmark them here
            </p>
            <Link href="/library">
              <button className="text-sm font-medium bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/20 px-5 py-2.5 rounded-lg transition-colors">
                Go to Library
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((prompt, i) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-xl border border-amber-400/10 bg-card hover:border-amber-400/20 transition-all"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-medium text-white text-sm leading-snug flex-1">{prompt.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <QualityBadge score={prompt.qualityScore} />
                      <Badge variant="secondary" className="text-xs capitalize bg-amber-400/10 text-amber-400 border-0">
                        {prompt.category}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed line-clamp-3">
                    {prompt.content}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-5 pb-4 border-t border-white/5 pt-3">
                  <span className="text-xs text-muted-foreground flex-1">
                    {new Date(prompt.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    data-testid={`button-remove-favorite-${prompt.id}`}
                    onClick={() => handleRemove(prompt.id)}
                    className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <StarOff className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`button-copy-favorite-${prompt.id}`}
                    onClick={() => handleCopy(prompt.content)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
