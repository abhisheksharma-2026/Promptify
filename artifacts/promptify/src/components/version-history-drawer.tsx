import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History, RotateCcw, Award, ChevronRight, Clock, Wand2,
  AlignLeft, ZoomIn, MessageSquare, BookOpen, Layout, X, Copy
} from "lucide-react";
import {
  useListPromptVersions,
  useRestorePromptVersion,
  getListPromptsQueryKey,
  getListPromptVersionsQueryKey,
  type PromptVersion,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  create:           { label: "Created",        icon: Wand2,        color: "text-primary bg-primary/10 border-primary/20" },
  edit:             { label: "Edited",          icon: AlignLeft,    color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  more_concise:     { label: "More Concise",    icon: AlignLeft,    color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  more_detailed:    { label: "More Detailed",   icon: ZoomIn,       color: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
  more_specific:    { label: "More Specific",   icon: Wand2,        color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
  different_angle:  { label: "New Angle",       icon: RotateCcw,    color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  change_tone:      { label: "Tone Changed",    icon: MessageSquare,color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
  add_examples:     { label: "Examples Added",  icon: BookOpen,     color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  change_format:    { label: "Format Changed",  icon: Layout,       color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
};

function getActionMeta(action: string) {
  if (action.startsWith("restore_v")) {
    return { label: `Restored`, icon: RotateCcw, color: "text-teal-400 bg-teal-400/10 border-teal-400/20" };
  }
  return ACTION_META[action] ?? { label: action, icon: History, color: "text-muted-foreground bg-white/5 border-white/10" };
}

function QualityPip({ score }: { score: number | null | undefined }) {
  if (!score) return null;
  const color = score >= 8 ? "text-emerald-400" : score >= 5 ? "text-amber-400" : "text-red-400";
  return (
    <span className={`flex items-center gap-0.5 text-xs font-bold ${color}`}>
      <Award className="w-3 h-3" />{score}
    </span>
  );
}

function VersionCard({
  version,
  isCurrent,
  onRestore,
  onCopy,
  isRestoring,
}: {
  version: PromptVersion;
  isCurrent: boolean;
  onRestore: () => void;
  onCopy: () => void;
  isRestoring: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = getActionMeta(version.action);
  const Icon = meta.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border transition-all ${
        isCurrent
          ? "border-primary/30 bg-primary/5"
          : "border-white/5 bg-card hover:border-white/10"
      }`}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-muted-foreground/60 w-7 text-right flex-shrink-0">
            v{version.versionNumber}
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>
            <Icon className="w-3 h-3" />{meta.label}
          </span>
          {isCurrent && (
            <span className="ml-auto text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              Current
            </span>
          )}
          {!isCurrent && <QualityPip score={version.qualityScore} />}
          {isCurrent && <QualityPip score={version.qualityScore} />}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2 ml-9">
          <Clock className="w-3 h-3" />
          {new Date(version.createdAt).toLocaleString(undefined, {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </div>

        {/* Content preview */}
        <div
          className={`ml-9 font-mono text-xs text-slate-400 leading-relaxed cursor-pointer transition-all ${
            expanded ? "" : "line-clamp-2"
          }`}
          onClick={() => setExpanded(!expanded)}
        >
          {version.content}
        </div>
        {version.content.length > 120 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-9 text-xs text-primary/60 hover:text-primary mt-1 flex items-center gap-0.5"
          >
            {expanded ? "Show less" : "Show more"}
            <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 ml-9">
          <button
            onClick={onCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <Copy className="w-3 h-3" /> Copy
          </button>
          {!isCurrent && (
            <button
              onClick={onRestore}
              disabled={isRestoring}
              className="flex items-center gap-1 text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors disabled:opacity-50 ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              {isRestoring ? "Restoring..." : "Restore"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface VersionHistoryDrawerProps {
  promptId: number;
  promptTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function VersionHistoryDrawer({
  promptId,
  promptTitle,
  open,
  onClose,
}: VersionHistoryDrawerProps) {
  const queryClient = useQueryClient();
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const { data: versions, isLoading } = useListPromptVersions(promptId, {
    query: {
      queryKey: getListPromptVersionsQueryKey(promptId),
      enabled: open,
    },
  });

  const restore = useRestorePromptVersion();

  const currentVersionNumber = versions?.[0]?.versionNumber ?? null;

  const handleRestore = (versionId: number) => {
    setRestoringId(versionId);
    restore.mutate(
      { id: promptId, versionId },
      {
        onSuccess: () => {
          toast.success("Prompt restored to this version");
          queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPromptVersionsQueryKey(promptId) });
        },
        onError: () => toast.error("Failed to restore version"),
        onSettled: () => setRestoringId(null),
      },
    );
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Version content copied");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] max-w-full bg-[#080b13] border-l border-white/5 flex flex-col p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <History className="w-4 h-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-white text-sm font-semibold leading-tight">
                  Version History
                </SheetTitle>
                <p className="text-xs text-muted-foreground truncate max-w-[250px]">{promptTitle}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
          {versions && (
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-white">{versions.length}</span> version{versions.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-muted-foreground">
                Latest: <span className="text-white font-medium">v{currentVersionNumber}</span>
              </span>
            </div>
          )}
        </SheetHeader>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-card p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))
          ) : !versions?.length ? (
            <div className="text-center py-16">
              <History className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No version history yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Versions are saved automatically when you create or edit prompts.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {versions.map((version) => (
                <VersionCard
                  key={version.id}
                  version={version}
                  isCurrent={version.versionNumber === currentVersionNumber}
                  onRestore={() => handleRestore(version.id)}
                  onCopy={() => handleCopy(version.content)}
                  isRestoring={restoringId === version.id}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-4 border-t border-white/5 flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Restoring a version creates a new version — you can always go back.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
