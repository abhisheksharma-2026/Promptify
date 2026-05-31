import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Copy, Save, Award, RefreshCw, ChevronDown,
  Wand2, AlignLeft, ZoomIn, RotateCcw, MessageSquare, BookOpen, Layout
} from "lucide-react";
import { useCreatePrompt, getListPromptsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  "writing", "marketing", "coding", "business", "trading", "youtube", "education", "design"
];
const TONES = ["professional", "casual", "formal", "creative", "technical", "persuasive"];

const ITERATE_ACTIONS = [
  { key: "more_concise", label: "More Concise", icon: AlignLeft },
  { key: "more_detailed", label: "More Detailed", icon: ZoomIn },
  { key: "more_specific", label: "More Specific", icon: Wand2 },
  { key: "different_angle", label: "Different Angle", icon: RotateCcw },
  { key: "change_tone", label: "Change Tone", icon: MessageSquare },
  { key: "add_examples", label: "Add Examples", icon: BookOpen },
  { key: "change_format", label: "Change Format", icon: Layout },
];

function extractQualityScore(text: string): number | null {
  const match = text.match(/Quality Score:\s*(\d+)\/10/i);
  return match ? parseInt(match[1]) : null;
}

function QualityScoreBadge({ score }: { score: number }) {
  const isHigh = score >= 8;
  const isMid = score >= 5;
  const colorClass = isHigh
    ? "from-emerald-500 to-green-400 shadow-emerald-500/30"
    : isMid
    ? "from-amber-500 to-yellow-400 shadow-amber-500/30"
    : "from-red-500 to-rose-400 shadow-red-500/30";
  return (
    <motion.div
      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}
      className={`flex flex-col items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${colorClass} shadow-lg`}
    >
      <Award className="w-4 h-4 text-white mb-0.5" />
      <span className="text-2xl font-bold text-white leading-none">{score}</span>
      <span className="text-xs text-white/80">/10</span>
    </motion.div>
  );
}

export default function GeneratePage() {
  const [userInput, setUserInput] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tone, setTone] = useState<string>("");
  const [streaming, setStreaming] = useState(false);
  const [output, setOutput] = useState("");
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [iterating, setIterating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const createPrompt = useCreatePrompt();
  const queryClient = useQueryClient();

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const startGenerate = async (url: string, body: object, isIterate = false) => {
    if (isIterate) setIterating(true);
    else setStreaming(true);
    setOutput("");
    setQualityScore(null);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${basePath}/api${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        toast.error(err.error || "Failed to generate");
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.content) {
              fullText += data.content;
              setOutput(fullText);
              const score = extractQualityScore(fullText);
              if (score) setQualityScore(score);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") toast.error("Generation failed");
    } finally {
      setStreaming(false);
      setIterating(false);
    }
  };

  const handleGenerate = () => {
    if (!userInput.trim()) {
      toast.error("Please enter your prompt idea");
      return;
    }
    startGenerate("/prompts/generate", {
      userInput,
      category: category || undefined,
      tone: tone || undefined,
    });
  };

  const handleIterate = (action: string) => {
    if (!output) return;
    startGenerate("/prompts/iterate", { promptContent: output, action }, true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };

  const handleSave = async () => {
    if (!output) return;
    const lines = output.split("\n").filter(Boolean);
    const title = userInput.slice(0, 60) || lines[0]?.slice(0, 60) || "Generated Prompt";
    createPrompt.mutate(
      {
        data: {
          title,
          content: output,
          category: category || "general",
          qualityScore: qualityScore ?? undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Prompt saved to library");
          queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() });
        },
        onError: () => toast.error("Failed to save prompt"),
      },
    );
  };

  const cleanOutput = output.replace(/Quality Score:\s*\d+\/10/i, "").trim();
  const isLoading = streaming || iterating;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white">Prompt Generator</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Type one idea — get an expert-level, APEX-optimized prompt
          </p>
        </motion.div>

        {/* Input Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/5 bg-card p-6 mb-6"
        >
          <Textarea
            data-testid="input-prompt-idea"
            placeholder='Describe your prompt idea... e.g. "I need a trading strategy for crypto" or "Write a cold email for my SaaS"'
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
            }}
            className="min-h-[120px] bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-muted-foreground/50 text-base resize-none p-0"
          />
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/5">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-category" className="w-40 bg-white/5 border-white/10 text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger data-testid="select-tone" className="w-40 bg-white/5 border-white/10 text-sm">
                <SelectValue placeholder="Tone" />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <p className="text-xs text-muted-foreground hidden sm:block">⌘ + Enter to generate</p>
            <Button
              data-testid="button-generate"
              onClick={handleGenerate}
              disabled={isLoading || !userInput.trim()}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white font-semibold px-6 gap-2"
            >
              {streaming ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate</>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Output Panel */}
        <AnimatePresence>
          {(output || streaming) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-white/5 bg-card overflow-hidden"
            >
              {/* Output Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">Generated Prompt</span>
                  {streaming && (
                    <span className="flex items-center gap-1.5 text-xs text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      Streaming...
                    </span>
                  )}
                  {iterating && (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Iterating...
                    </span>
                  )}
                </div>
                {qualityScore && <QualityScoreBadge score={qualityScore} />}
              </div>

              {/* Output Content */}
              <div className="p-6">
                <pre className="whitespace-pre-wrap font-mono text-sm text-slate-200 leading-relaxed min-h-[100px]">
                  {cleanOutput}
                  {isLoading && <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />}
                </pre>
              </div>

              {/* Action Buttons */}
              {output && !streaming && (
                <>
                  <div className="px-6 pb-4 flex flex-wrap gap-2">
                    <Button
                      data-testid="button-copy-output"
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </Button>
                    <Button
                      data-testid="button-save-prompt"
                      variant="outline"
                      size="sm"
                      onClick={handleSave}
                      disabled={createPrompt.isPending}
                      className="border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {createPrompt.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>

                  {/* Iterate Buttons */}
                  <div className="px-6 pb-6 border-t border-white/5 pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Refine this prompt</p>
                    <div className="flex flex-wrap gap-2">
                      {ITERATE_ACTIONS.map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          data-testid={`button-iterate-${key}`}
                          onClick={() => handleIterate(key)}
                          disabled={iterating}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-muted-foreground hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Icon className="w-3 h-3" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!output && !streaming && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Wand2 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Ready to craft your prompt</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Enter your idea above and Promptify's APEX framework will transform it into an expert-level prompt
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
