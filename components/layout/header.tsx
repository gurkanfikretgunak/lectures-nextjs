"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, MessageCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

// Extend Window interface for global assistant functions
declare global {
  interface Window {
    toggleGlobalAssistant?: () => void;
  }
}

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

interface HeaderProps {
  navigation: NavSection[];
  onSearchOpen?: () => void;
  onAssistantOpen?: () => void;
  showAssistantButton?: boolean;
}

export function Header({
  navigation,
  onSearchOpen,
  onAssistantOpen,
  showAssistantButton,
}: HeaderProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  
  // Hide assistant button on Learn to Prompt page (it has its own assistant)
  const isLearnToPromptPage = pathname?.startsWith("/learn-to-prompt");
  // Show assistant button by default unless explicitly hidden or on Learn to Prompt page
  const shouldShowAssistantButton = (showAssistantButton !== false) && !isLearnToPromptPage;
  
  const handleAssistantClick = () => {
    if (onAssistantOpen) {
      onAssistantOpen();
    } else if (typeof window !== "undefined" && window.toggleGlobalAssistant) {
      window.toggleGlobalAssistant();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 lg:px-6">
        <MobileSidebar navigation={navigation} />

        <Link href="/" className="flex items-center gap-2 ml-2 lg:ml-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/icon.png" 
            alt="AI & LLM Lectures" 
            className="h-6 w-6 rounded-full"
            width={24}
            height={24}
          />
          <span className="font-semibold text-lg hidden sm:inline-block">
            {t("siteTitle")}
          </span>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden sm:flex items-center gap-2 text-muted-foreground"
            onClick={onSearchOpen}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">{t("search")}</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={onSearchOpen}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          {/* AI Assistant Button - Top Right, near search */}
          {shouldShowAssistantButton && (
            <button
              onClick={handleAssistantClick}
              className={cn(
                "group relative",
                "h-9 px-3 rounded-lg",
                "bg-primary/10 hover:bg-primary/20",
                "border border-primary/20 hover:border-primary/30",
                "transition-all duration-200",
                "flex items-center gap-2",
                "text-sm font-medium text-primary"
              )}
              aria-label={t("aiAssistant")}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{t("aiAssistant")}</span>
              {/* Badge */}
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background">
                <div className="h-1 w-1 rounded-full bg-white animate-pulse m-0.5" />
              </div>
            </button>
          )}
          
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
