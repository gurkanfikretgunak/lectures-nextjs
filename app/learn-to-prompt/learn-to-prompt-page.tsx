"use client";

import { useState, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { Header } from "@/components/layout/header";
import { SearchCommand } from "@/components/search-command";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/language-context";
import { PromptSimulator } from "@/components/learn-to-prompt/prompt-simulator";
import { AssistantChat } from "@/components/learn-to-prompt/assistant-chat";
import { CompletionCertificate } from "@/components/learn-to-prompt/completion-certificate";
import {
  AUTH_SIGNIN_SIMULATION,
  type SimulationStep,
} from "@/components/learn-to-prompt/simulation-data";

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

interface LearnToPromptPageProps {
  navigation: NavSection[];
}

export function LearnToPromptPage({ navigation }: LearnToPromptPageProps) {
  const { language, t } = useLanguage();
  const [searchOpen, setSearchOpen] = useState(false);
  const [stepInputs, setStepInputs] = useState<Record<number, string>>({});
  const [currentStep, setCurrentStep] = useState<SimulationStep>(
    AUTH_SIGNIN_SIMULATION.steps[0]
  );
  const [isCompleted, setIsCompleted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const simulation = AUTH_SIGNIN_SIMULATION;
  const simTitle =
    language === "en" ? simulation.titleEn : simulation.titleTr;

  const allLectures = navigation.flatMap((section) =>
    section.items.map((item) => ({
      title: item.title,
      href: item.href,
      category: section.slug,
      description: item.description || "",
      slug: item.slug || "",
    }))
  );

  const handleStepChange = useCallback(
    (step: SimulationStep) => {
      setCurrentStep(step);
    },
    []
  );

  const handlePromptChange = useCallback((stepId: number, text: string) => {
    setStepInputs((prev) => ({ ...prev, [stepId]: text }));
  }, []);

  const handleComplete = useCallback(() => {
    setIsCompleted(true);
  }, []);

  const handleGoBack = useCallback(() => {
    setIsCompleted(false);
  }, []);

  const userPromptDraft = stepInputs[currentStep.id] || "";

  // Completed state
  if (isCompleted) {
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
        <main className="max-w-4xl mx-auto py-8 px-4">
          <CompletionCertificate
            simulation={simulation}
            stepInputs={stepInputs}
            language={language}
            onGoBack={handleGoBack}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        navigation={navigation}
        onSearchOpen={() => setSearchOpen(true)}
      />
      <SearchCommand
        items={allLectures}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />

      {/* Page Title Bar */}
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              {t("learnToPrompt")}
            </h1>
            <p className="text-xs text-muted-foreground">{simTitle}</p>
          </div>
          {/* Mobile chat toggle */}
          <Sheet open={chatOpen} onOpenChange={setChatOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden gap-1.5"
              >
                <MessageSquare className="h-4 w-4" />
                {t("aiAssistant")}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh] p-0">
              <AssistantChat
                simulationTitle={simTitle}
                currentStep={currentStep}
                userPromptDraft={userPromptDraft}
                language={language}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content - Responsive Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Prompt Simulator (~60%) */}
        <div className="flex-[3] min-w-0 border-r border-border overflow-hidden">
          <PromptSimulator
            simulation={simulation}
            language={language}
            onStepChange={handleStepChange}
            onPromptChange={handlePromptChange}
            onComplete={handleComplete}
            stepInputs={stepInputs}
          />
        </div>

        {/* Right: Assistant Chat (~40%) - Hidden on mobile */}
        <div className="hidden lg:flex flex-[2] min-w-0 overflow-hidden">
          <div className="w-full">
            <AssistantChat
              simulationTitle={simTitle}
              currentStep={currentStep}
              userPromptDraft={userPromptDraft}
              language={language}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
