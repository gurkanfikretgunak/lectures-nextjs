"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronLeft, BookOpen, Brain, Wrench, FolderOpen, Network, Briefcase } from "lucide-react";
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
import { useState, useMemo, useEffect } from "react";

interface NavItem {
  title: string;
  href: string;
  level?: number;
  description?: string;
  slug?: string;
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
  applications: Briefcase,
  resources: FolderOpen,
};

export function Sidebar({ navigation, defaultCollapsed = true, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // Memoize navigation slugs key to prevent unnecessary recalculations
  const navigationSlugsKey = useMemo(() => {
    if (!navigation || navigation.length === 0) return '';
    return navigation.map(s => s?.slug).filter(Boolean).join(',');
  }, [navigation]);
  
  // Memoize initial sections to prevent re-initialization on every render
  // Start with empty array so all sections are collapsed by default
  const initialSections = useMemo(() => {
    return [];
  }, []);
  
  const [openSections, setOpenSections] = useState<string[]>(initialSections);
  
  // Update openSections if navigation changes (but only if slugs actually changed)
  useEffect(() => {
    if (navigationSlugsKey && navigationSlugsKey !== openSections.join(',')) {
      setOpenSections(initialSections);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationSlugsKey]);

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
            {navigation && navigation.length > 0 ? (
              navigation.map((section) => {
                if (!section || !section.slug) return null;
                const Icon = categoryIcons[section.slug] || BookOpen;
                const isOpen = openSections.includes(section.slug);
                const hasActiveItem = section.items && section.items.some(item => item && pathname === item.href);

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
                    {section.items && section.items.length > 0 ? (
                      section.items.map((item) => {
                        if (!item || !item.href) return null;
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
                                <span className="text-xs font-medium">{item.level != null ? item.level : "?"}</span>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {item.title || item.slug || "Untitled"}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })
                    ) : null}
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
                    {section.items && section.items.length > 0 ? (
                      section.items.map((item) => {
                        if (!item || !item.href) return null;
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
                            <span className="truncate flex-1">{item.title || item.slug || "Untitled"}</span>
                            {item.level != null && (
                              <Badge
                                variant={isActive ? "secondary" : "default"}
                                className={cn(
                                  "text-[10px] px-1.5 py-0 flex-shrink-0",
                                  !isActive && "bg-muted-foreground/20 text-foreground/70 hover:bg-muted-foreground/30"
                                )}
                              >
                                {item.level}
                              </Badge>
                            )}
                          </Link>
                        );
                      })
                    ) : (
                      <div className="px-2 py-1 text-xs text-muted-foreground">No items available</div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
              })
            ) : (
              <div className="p-4 text-sm text-muted-foreground">No navigation available</div>
            )}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
}
