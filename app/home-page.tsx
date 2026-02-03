"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Brain,
  Wrench,
  FolderOpen,
  ArrowRight,
  Network,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { SearchCommand } from "@/components/search-command";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

interface HomePageProps {
  navigation: NavSection[];
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  prompting: BookOpen,
  llm: Brain,
  "ai-tooling": Wrench,
  reasoning: Network,
  resources: FolderOpen,
};

const categoryDescriptions: Record<string, string> = {
  prompting: "Learn the art of crafting effective prompts for AI models",
  llm: "Deep dive into Large Language Models and their architecture",
  "ai-tooling": "Explore tools and frameworks for AI development",
  reasoning: "Advanced reasoning patterns to enhance AI thinking capabilities",
  resources: "Additional learning materials and references",
};

export function HomePage({ navigation }: HomePageProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  const allLectures = navigation.flatMap((section) =>
    section.items.map((item) => ({
      title: item.title,
      href: item.href,
      category: section.slug,
    }))
  );

  return (
    <div className="min-h-screen bg-background">
      <Header navigation={navigation} onSearchOpen={() => setSearchOpen(true)} />
      <SearchCommand
        items={allLectures}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
      <div className="flex">
        <Sidebar navigation={navigation} />
        <main className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto px-4 py-12 lg:px-8">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-primary/10">
                  <GraduationCap className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                AI & LLM Lectures
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Comprehensive lecture resources for learning about Prompting, Large Language Models, and AI Tooling.
              </p>
            </div>

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
                        <Badge variant="secondary">{beginnerCount} Beginner</Badge>
                        <Badge variant="outline">{advancedCount} Advanced</Badge>
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
                            View all {section.items.length} lectures
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
              <h2 className="text-2xl font-semibold mb-4">Ready to Start Learning?</h2>
              <p className="text-muted-foreground mb-6">
                Begin with Prompting 101 to build a strong foundation.
              </p>
              {navigation[0]?.items[0] && (
                <Button asChild size="lg">
                  <Link href={navigation[0].items[0].href}>
                    Start with {navigation[0].items[0].title}
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
