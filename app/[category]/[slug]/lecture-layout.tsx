"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowUp } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { TableOfContents } from "@/components/layout/toc";
import { SearchCommand } from "@/components/search-command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/language-context";
import { ErrorBoundary } from "@/components/error-boundary";

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

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface Lecture {
  title: string;
  description: string;
  category: string;
  level: number;
  slug: string;
}

interface LectureLayoutProps {
  children: React.ReactNode;
  navigation: NavSection[];
  headings: Heading[];
  lecture: Lecture;
}

export function LectureLayout({
  children,
  navigation,
  headings,
  lecture,
}: LectureLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const pathname = usePathname();
  const mainContentRef = useRef<HTMLElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const { t } = useLanguage();

  // Show scroll-to-top button after scrolling 400px
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get all lectures for search and navigation
  const allLectures = navigation.flatMap((section) =>
    section.items.map((item) => ({
      title: item.title,
      href: item.href,
      category: section.slug,
      description: item.description || "",
      slug: item.slug || "",
    }))
  );

  // Find current lecture index for prev/next navigation
  const currentIndex = allLectures.findIndex(
    (l) => l.href === `/${lecture.category}/${lecture.slug}`
  );
  const prevLecture = currentIndex > 0 ? allLectures[currentIndex - 1] : null;
  const nextLecture =
    currentIndex < allLectures.length - 1 ? allLectures[currentIndex + 1] : null;

  const levelLabel = lecture.level >= 200 ? t("advanced") : t("beginner");
  const levelVariant = lecture.level >= 200 ? "default" : "secondary";

  // Scroll to top and focus main content when pathname changes
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Focus on article element for accessibility
      if (articleRef.current) {
        articleRef.current.focus();
        // Remove focus after a moment to avoid focus outline
        setTimeout(() => {
          if (document.activeElement === articleRef.current) {
            articleRef.current?.blur();
          }
        }, 100);
      }
    };

    // Small delay to ensure content is rendered
    const timer = setTimeout(scrollToTop, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleNavigate = () => {
    // This will be called before navigation
    // The useEffect will handle scrolling after navigation completes
  };

  return (
    <div className="min-h-screen bg-background">
      <Header navigation={navigation} onSearchOpen={() => setSearchOpen(true)} />
      <SearchCommand
        items={allLectures}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
      <div className="flex">
        <Sidebar navigation={navigation} onNavigate={handleNavigate} />
        <main ref={mainContentRef} className="flex-1 min-w-0" tabIndex={-1}>
          <div className="flex">
            <article 
              ref={articleRef}
              className="flex-1 min-w-0 px-4 py-8 lg:px-8 lg:py-12 max-w-4xl mx-auto focus:outline-none"
              tabIndex={-1}
            >
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Link
                    href="/"
                    className="hover:text-foreground transition-colors"
                  >
                    {t("home")}
                  </Link>
                  <span>/</span>
                  <span className="capitalize">
                    {lecture.category.replace("-", " ")}
                  </span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-4">
                  {lecture.title}
                </h1>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant={levelVariant}>{levelLabel}</Badge>
                  <Badge variant="outline">{lecture.level}</Badge>
                </div>
              </div>

              <Separator className="mb-8" />

              {/* Content */}
              <ErrorBoundary>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  {children}
                </div>
              </ErrorBoundary>

              {/* Navigation */}
              <Separator className="my-8" />
              <div className="flex items-center justify-between">
                {prevLecture ? (
                  <Button variant="ghost" asChild>
                    <Link href={prevLecture.href} className="flex items-center gap-2">
                      <ChevronLeft className="h-4 w-4" />
                      <div className="text-left">
                        <div className="text-xs text-muted-foreground">{t("previous")}</div>
                        <div className="text-sm font-medium">{prevLecture.title}</div>
                      </div>
                    </Link>
                  </Button>
                ) : (
                  <div />
                )}
                {nextLecture ? (
                  <Button variant="ghost" asChild>
                    <Link href={nextLecture.href} className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">{t("next")}</div>
                        <div className="text-sm font-medium">{nextLecture.title}</div>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <div />
                )}
              </div>
            </article>
            <TableOfContents headings={headings} />
          </div>
        </main>
      </div>

      {/* Scroll to top FAB */}
      <Button
        variant="secondary"
        size="icon"
        className={`fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full shadow-lg border border-border/50 transition-all duration-300 ${
          showScrollTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={t("scrollToTop")}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}
