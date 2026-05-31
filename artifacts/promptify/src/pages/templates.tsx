import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Copy, ArrowRight, LayoutTemplate,
  PenLine, Megaphone, Code2, Briefcase, TrendingUp,
  PlayCircle, GraduationCap, Palette
} from "lucide-react";
import { useListTemplates, useListCategories, getListTemplatesQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  writing: PenLine, marketing: Megaphone, coding: Code2, business: Briefcase,
  trading: TrendingUp, youtube: PlayCircle, education: GraduationCap, design: Palette,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: templates, isLoading } = useListTemplates(
    { search: search || undefined, category: selectedCategory === "all" ? undefined : selectedCategory },
    { query: { queryKey: getListTemplatesQueryKey({ search: search || undefined, category: selectedCategory === "all" ? undefined : selectedCategory }) } }
  );
  const { data: categories } = useListCategories();

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Template copied — paste it into your prompt!");
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-white">Templates</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Ready-to-use prompt templates — copy and customize for any task
          </p>
        </motion.div>

        {/* Category Pills */}
        <motion.div
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            All
          </button>
          {categories?.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.slug] || LayoutTemplate;
            return (
              <button
                key={cat.id}
                data-testid={`button-category-${cat.slug}`}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            );
          })}
        </motion.div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-search-templates"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-white/10 focus-visible:border-primary/50"
          />
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-card p-5">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : !templates?.length ? (
          <div className="text-center py-20">
            <LayoutTemplate className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No templates found</h3>
            <p className="text-sm text-muted-foreground">Try a different search or category</p>
          </div>
        ) : (
          <motion.div
            variants={container} initial="hidden" animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {templates.map((template) => {
              const Icon = CATEGORY_ICONS[template.category] || LayoutTemplate;
              const isExpanded = expandedId === template.id;
              return (
                <motion.div
                  key={template.id}
                  variants={item}
                  data-testid={`card-template-${template.id}`}
                  className="group rounded-xl border border-white/5 bg-card hover:border-white/10 transition-all flex flex-col"
                >
                  <div className="p-5 flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs capitalize bg-white/5 text-muted-foreground border-0 ml-auto">
                        {template.category}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1.5">{template.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{template.description}</p>
                    <div
                      className={`font-mono text-xs text-slate-400 leading-relaxed bg-black/20 rounded-lg p-3 cursor-pointer ${isExpanded ? "" : "line-clamp-3"}`}
                      onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    >
                      {template.content}
                    </div>
                  </div>
                  <div className="px-5 pb-5 flex gap-2">
                    <button
                      data-testid={`button-copy-template-${template.id}`}
                      onClick={() => handleCopy(template.content)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Template
                    </button>
                    <Link href={`/generate`}>
                      <button
                        data-testid={`button-use-template-${template.id}`}
                        className="flex items-center justify-center gap-1 text-xs font-medium px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/10 transition-all"
                        onClick={() => {
                          navigator.clipboard.writeText(template.content);
                          toast.success("Template copied — now use it in the generator!");
                        }}
                      >
                        Use <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
