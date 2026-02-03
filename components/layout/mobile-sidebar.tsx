"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, BookOpen, Brain, Wrench, FolderOpen, Menu, Network, Briefcase } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

interface MobileSidebarProps {
  navigation: NavSection[];
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  prompting: BookOpen,
  llm: Brain,
  "ai-tooling": Wrench,
  reasoning: Network,
  applications: Briefcase,
  resources: FolderOpen,
};

export function MobileSidebar({ navigation }: MobileSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(
    navigation && navigation.length > 0
      ? navigation.map((section) => section?.slug).filter(Boolean) as string[]
      : []
  );

  const toggleSection = (slug: string) => {
    setOpenSections((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left">Navigation</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <nav className="p-4 space-y-2">
            {navigation && navigation.length > 0 ? (
              navigation.map((section) => {
                if (!section || !section.slug) return null;
                const Icon = categoryIcons[section.slug] || BookOpen;
                const isOpen = openSections.includes(section.slug);

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
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center justify-between py-1.5 px-2 text-sm rounded-md transition-colors",
                              isActive
                                ? "bg-primary text-primary-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            <span className="truncate">{item.title || item.slug || "Untitled"}</span>
                            {item.level != null && (
                              <Badge
                                variant={isActive ? "secondary" : "outline"}
                                className="text-[10px] px-1.5 py-0"
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
      </SheetContent>
    </Sheet>
  );
}
