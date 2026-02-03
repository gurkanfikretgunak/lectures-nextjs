"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronLeft, BookOpen, Brain, Wrench, FolderOpen, Network } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  title: string;
  href: string;
  level?: number;
}

interface NavSection {
  title: string;
  slug: string;
  items: NavItem[];
}

interface SidebarProps {
  navigation: NavSection[];
  defaultCollapsed?: boolean;
  onNavigate?: () => void;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  prompting: BookOpen,
  llm: Brain,
  "ai-tooling": Wrench,
  reasoning: Network,
  resources: FolderOpen,
};

export function Sidebar({ navigation, defaultCollapsed = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [openSections, setOpenSections] = useState<string[]>(
    navigation.map((section) => section.slug)
  );

  const toggleSection = (slug: string) => {
    setOpenSections((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  };

  const handleLinkClick = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    // If clicking on the same page, just scroll to top and focus
    if (pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Focus on main content for accessibility
      const mainContent = document.querySelector("main");
      if (mainContent) {
        (mainContent as HTMLElement).focus();
      }
      return;
    }

    // Call onNavigate callback if provided (for different page navigation)
    if (onNavigate) {
      onNavigate();
    }

    // Note: For navigation to different pages, Next.js Link will handle the navigation
    // The useEffect in LectureLayout will handle scrolling after navigation completes
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-muted/30 transition-all duration-300 overflow-hidden flex-shrink-0",
          isCollapsed ? "w-[60px]" : "w-72"
        )}
      >
        {/* Collapse Toggle Button */}
        <div className={cn(
          "flex items-center p-2 border-b border-border",
          isCollapsed ? "justify-center" : "justify-end"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {navigation.map((section) => {
              const Icon = categoryIcons[section.slug] || BookOpen;
              const isOpen = openSections.includes(section.slug);
              const hasActiveItem = section.items.some(item => pathname === item.href);

              if (isCollapsed) {
                // Collapsed view - show only icons with tooltips
                return (
                  <div key={section.slug} className="space-y-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center justify-center p-2 rounded-md cursor-default",
                            hasActiveItem ? "bg-primary/10" : ""
                          )}
                        >
                          <Icon className={cn(
                            "h-5 w-5",
                            hasActiveItem ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {section.title}
                      </TooltipContent>
                    </Tooltip>
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.href}
                              onClick={(e) => handleLinkClick(item.href, e)}
                              className={cn(
                                "flex items-center justify-center p-2 rounded-md transition-colors",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              )}
                            >
                              <span className="text-xs font-medium">{item.level}</span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                );
              }

              // Expanded view
              return (
                <Collapsible
                  key={section.slug}
                  open={isOpen}
                  onOpenChange={() => toggleSection(section.slug)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{section.title}</span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isOpen && "rotate-90"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 space-y-1 mt-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={(e) => handleLinkClick(item.href, e)}
                          className={cn(
                            "flex items-center justify-between py-1.5 px-2 text-sm rounded-md transition-colors gap-2",
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <span className="truncate flex-1">{item.title}</span>
                          <Badge
                            variant={isActive ? "secondary" : "default"}
                            className={cn(
                              "text-[10px] px-1.5 py-0 flex-shrink-0",
                              !isActive && "bg-muted-foreground/20 text-foreground/70 hover:bg-muted-foreground/30"
                            )}
                          >
                            {item.level}
                          </Badge>
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
}
