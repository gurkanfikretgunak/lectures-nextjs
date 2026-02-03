"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, BookOpen, Brain, Wrench, FolderOpen, Network, Briefcase } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLanguage } from "@/contexts/language-context";

interface SearchItem {
  title: string;
  href: string;
  category: string;
  description?: string;
  slug?: string;
}

interface SearchCommandProps {
  items: SearchItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  prompting: BookOpen,
  llm: Brain,
  "ai-tooling": Wrench,
  reasoning: Network,
  applications: Briefcase,
  resources: FolderOpen,
};

export function SearchCommand({ items, open, onOpenChange }: SearchCommandProps) {
  const router = useRouter();
  const { t } = useLanguage();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("searchPlaceholder")} />
      <CommandList>
        <CommandEmpty>{t("noResultsFound")}</CommandEmpty>
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const Icon = categoryIcons[category] || FileText;
          const formattedCategory = category
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          return (
            <CommandGroup key={category} heading={formattedCategory}>
              {categoryItems.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`${item.title} ${item.category} ${item.description || ""} ${item.slug || ""} ${item.href}`}
                  onSelect={() => handleSelect(item.href)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
