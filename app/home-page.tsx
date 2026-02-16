"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  Wrench,
  FolderOpen,
  ArrowRight,
  Network,
  Briefcase,
  Sparkles,
  Database,
  Search,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { SearchCommand } from "@/components/search-command";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

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

interface HomePageProps {
  navigation: NavSection[];
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  prompting: BookOpen,
  llm: Brain,
  "ai-tooling": Wrench,
  mcp: Database,
  rag: Search,
  reasoning: Network,
  applications: Briefcase,
  resources: FolderOpen,
};

export function HomePage({ navigation }: HomePageProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { t } = useLanguage();
  
  const categoryDescriptions: Record<string, string> = {
    prompting: t("promptingDesc"),
    llm: t("llmDesc"),
    "ai-tooling": t("aiToolingDesc"),
    mcp: t("mcpDesc"),
    rag: t("ragDesc"),
    reasoning: t("reasoningDesc"),
    applications: t("applicationsDesc"),
    resources: t("resourcesDesc"),
  };

  const allLectures = navigation.flatMap((section) =>
    section.items.map((item) => ({
      title: item.title,
      href: item.href,
      category: section.slug,
      description: item.description || "",
      slug: item.slug || "",
    }))
  );

  return (
    <div className="min-h-screen bg-background">
      <Header
        navigation={navigation}
        onSearchOpen={() => setSearchOpen(true)}
      />
      <SearchCommand
        items={allLectures}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
      <div className="flex relative">
        <Sidebar navigation={navigation} />
        <main className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto px-4 py-12 lg:px-8">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-primary/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/icon.png" 
                    alt="AI & LLM Lectures" 
                    className="h-32 w-32 rounded-full"
                    width={48}
                    height={48}
                  />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                {t("heroTitle")}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("heroDescription")}
              </p>
            </div>


            {/* Learn to Prompt CTA */}
            <Card className="prompt-cta-card mt-8 mb-6 border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 group hover:border-primary/50 transition-colors">
              <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-6">
                <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors sparkles-container">
                  <Sparkles className="h-6 w-6 text-primary sparkles-icon" />
                  <span className="sparkles-firefly" />
                  <span className="sparkles-firefly" />
                  <span className="sparkles-firefly" />
                  <span className="sparkles-firefly" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-semibold">{t("learnToPrompt")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("learnToPromptDesc")}
                  </p>
                </div>
                <Button asChild className="gap-2">
                  <Link href="/learn-to-prompt">
                    {t("startSimulation")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Course Categories */}
            <div className="grid gap-6 md:grid-cols-2">
              {navigation.map((section) => {
                const Icon = categoryIcons[section.slug] || BookOpen;
                const description = categoryDescriptions[section.slug] || "";
                const beginnerCount = section.items.filter(
                  (item) => item.level && item.level < 200
                ).length;
                const advancedCount = section.items.filter(
                  (item) => item.level && item.level >= 200
                ).length;

                return (
                  <Card key={section.slug} className="group hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                          <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{section.title}</CardTitle>
                          <CardDescription>{description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary">{beginnerCount} {t("beginner")}</Badge>
                        <Badge variant="outline">{advancedCount} {t("advanced")}</Badge>
                      </div>
                      <div className="space-y-2">
                        {section.items.slice(0, 3).map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors text-sm"
                          >
                            <span>{item.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.level}
                            </Badge>
                          </Link>
                        ))}
                        {section.items.length > 3 && (
                          <Link
                            href={section.items[0].href}
                            className="flex items-center text-sm text-primary hover:underline pt-2"
                          >
                            {t("viewAllLectures").replace("{count}", section.items.length.toString())}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>


            {/* Quick Start */}
            <div className="mt-16 text-center">
              <h2 className="text-2xl font-semibold mb-4">{t("readyToStart")}</h2>
              <p className="text-muted-foreground mb-6">
                {t("startWith")} {navigation[0]?.items[0]?.title || "Prompting 101"} {t("toBuild")}
              </p>
              {navigation[0]?.items[0] && (
                <Button asChild size="lg">
                  <Link href={navigation[0].items[0].href}>
                    {t("startWith")} {navigation[0].items[0].title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
