"use client";

import { useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Lightbulb,
  Trophy,
  Info,
  CheckCircle2,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  type Simulation,
  type SimulationStep,
  scoreStep,
} from "./simulation-data";

interface PromptSimulatorProps {
  simulation: Simulation;
  language: "en" | "tr";
  onStepChange: (step: SimulationStep) => void;
  onPromptChange: (stepId: number, text: string) => void;
  onComplete: (stepInputs: Record<number, string>) => void;
  stepInputs: Record<number, string>;
}

export function PromptSimulator({
  simulation,
  language,
  onStepChange,
  onPromptChange,
  onComplete,
  stepInputs,
}: PromptSimulatorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const steps = simulation.steps;
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const title = language === "en" ? currentStep.titleEn : currentStep.titleTr;
  const description =
    language === "en" ? currentStep.descriptionEn : currentStep.descriptionTr;
  const hint = language === "en" ? currentStep.hintEn : currentStep.hintTr;
  const placeholder =
    language === "en" ? currentStep.placeholderEn : currentStep.placeholderTr;

  const currentInput = stepInputs[currentStep.id] || "";
  const currentScore = scoreStep(currentStep, currentInput);

  const goToStep = useCallback(
    (index: number) => {
      setCurrentStepIndex(index);
      setShowHint(false);
      onStepChange(steps[index]);
    },
    [steps, onStepChange]
  );

  const handleNext = () => {
    if (isLastStep) {
      onComplete(stepInputs);
    } else {
      goToStep(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      goToStep(currentStepIndex - 1);
    }
  };

  const handleInputChange = (value: string) => {
    onPromptChange(currentStep.id, value);
  };

  // Check if a step has been filled
  const isStepFilled = (stepId: number) => {
    const input = stepInputs[stepId] || "";
    return input.trim().length > 0;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Step Progress Bar */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/20">
        {steps.map((step, index) => {
          const filled = isStepFilled(step.id);
          const active = index === currentStepIndex;
          const stepScore = filled ? scoreStep(step, stepInputs[step.id] || "") : 0;

          return (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                  : filled && stepScore >= 50
                    ? "bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/40"
                    : filled
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40"
                      : "bg-muted text-muted-foreground border border-border"
              )}
            >
              {filled && !active ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                step.id
              )}
            </button>
          );
        })}
        <div className="flex-1" />
        <Badge variant="outline" className="text-xs">
          {language === "en" ? "Step" : "Adim"} {currentStepIndex + 1}/{steps.length}
        </Badge>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Step Header - Enhanced */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
              <Badge variant="secondary" className="text-xs">
                {language === "en" ? "Step" : "Adim"} {currentStep.id}/6
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          {/* Expanded Explanation Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" />
                {language === "en" ? "Why This Matters" : "Neden Onemli"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentStep.id === 1 &&
                  (language === "en"
                    ? "A clear goal sets the foundation. Without it, the AI doesn't know what to build. Be specific about the component type, features, and behaviors you need."
                    : "Net bir hedef temel olusturur. Olmadan AI ne olusturacagini bilmez. Bilesen turu, ozellikler ve ihtiyac duydugunuz davranislar konusunda spesifik olun.")}
                {currentStep.id === 2 &&
                  (language === "en"
                    ? "Assigning a role gives the AI domain expertise. A 'senior React developer' will write production-ready code with best practices, while a generic prompt gives generic results."
                    : "Rol atamak AI'ye alan uzmanligi verir. 'Kidemli React gelistirici' en iyi uygulamalarla uretime hazir kod yazar, genel prompt ise genel sonuclar verir.")}
                {currentStep.id === 3 &&
                  (language === "en"
                    ? "Context prevents the AI from guessing. Specify your tech stack, design constraints, and requirements upfront to get exactly what you need."
                    : "Baglam AI'nin tahmin etmesini onler. Tam olarak ihtiyaciniz olani almak icin teknoloji yigininizi, tasarim kisitlamalarinizi ve gereksinimlerinizi onceden belirtin.")}
                {currentStep.id === 4 &&
                  (language === "en"
                    ? "Defining input/output eliminates ambiguity. The AI knows exactly what props to accept, what to return, and in what format."
                    : "Girdi/ciktiyi tanimlamak belirsizligi ortadan kaldirir. AI hangi props'lari kabul edecegini, ne dondurecegini ve hangi formatta oldugunu tam olarak bilir.")}
                {currentStep.id === 5 &&
                  (language === "en"
                    ? "Examples are the most powerful prompt engineering technique. They show the AI exactly what good output looks like, dramatically improving results."
                    : "Ornekler en guclu prompt muhendisligi teknigidir. AI'ye iyi ciktinin tam olarak nasil gorundugunu gosterir ve sonuclari onemli olcude iyilestirir.")}
                {currentStep.id === 6 &&
                  (language === "en"
                    ? "Combining all parts creates a complete, production-ready prompt. Review for clarity, completeness, and specificity before using it."
                    : "Tum parcalari birlestirmek tam, uretime hazir bir prompt olusturur. Kullanmadan once netlik, tamlik ve ozgunluk acisindan gozden gecirin.")}
              </p>
            </CardContent>
          </Card>

          {/* What to Include Checklist */}
          <Card className="border-border">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                {language === "en" ? "What to Include" : "Dahil Edilecekler"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ul className="text-xs space-y-1.5 text-muted-foreground">
                {currentStep.id === 1 &&
                  (language === "en" ? (
                    <>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Component type (form, page, modal, etc.)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Required fields (email, password, remember me)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Behaviors (validation, error handling, loading states)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Start with &quot;Create a...&quot; or &quot;Build a...&quot;</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Bilesen turu (form, sayfa, modal, vb.)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Gerekli alanlar (e-posta, sifre, beni hatirlat)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Davranislar (dogrulama, hata isleme, yukleniyor durumlari)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>&quot;Olustur...&quot; veya &quot;Yap...&quot; ile baslayin</span>
                      </li>
                    </>
                  ))}
                {currentStep.id === 2 &&
                  (language === "en" ? (
                    <>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Start with &quot;You are a...&quot; or &quot;Act as a...&quot;</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Experience level (junior, mid-level, senior, expert)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Specialization (frontend, backend, full-stack, security)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Years of experience or specific expertise areas</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>&quot;Siz bir...&quot; veya &quot;Bir... olarak hareket edin&quot; ile baslayin</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Deneyim seviyesi (junior, orta, kidemli, uzman)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Uzmanlik alani (frontend, backend, full-stack, guvenlik)</span>
                      </li>
                    </>
                  ))}
                {currentStep.id === 3 &&
                  (language === "en" ? (
                    <>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Framework (React, Next.js, Vue, Angular)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Language (TypeScript, JavaScript, Python)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Styling approach (Tailwind, CSS Modules, styled-components)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Libraries (shadcn/ui, Zod, React Hook Form)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Design requirements (responsive, dark mode, accessible)</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Framework (React, Next.js, Vue, Angular)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Dil (TypeScript, JavaScript, Python)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Stillendirme yaklasimi (Tailwind, CSS Modules)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Kutuphaneler (shadcn/ui, Zod, React Hook Form)</span>
                      </li>
                    </>
                  ))}
                {currentStep.id === 4 &&
                  (language === "en" ? (
                    <>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Input props: What data does the component receive?</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Output format: Single file? Multiple files? Just the component?</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Return type: JSX component, TypeScript interface, hooks?</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>File structure: Where should code be organized?</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Girdi props: Bilesen hangi verileri alir?</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Cikti formati: Tek dosya? Birden cok dosya? Sadece bilesen?</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Donus tipi: JSX bilesen, TypeScript arayuz, hooks?</span>
                      </li>
                    </>
                  ))}
                {currentStep.id === 5 &&
                  (language === "en" ? (
                    <>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Happy path: User enters valid credentials → success</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Error cases: Invalid email, wrong password, network error</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Edge cases: Empty fields, very long inputs</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Use &quot;Example:&quot; or &quot;When...&quot; to introduce scenarios</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Mutlu yol: Kullanici gecerli kimlik bilgileri girer → basari</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Hata durumlari: Gecersiz e-posta, yanlis sifre</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Uc durumlar: Bos alanlar, cok uzun girdiler</span>
                      </li>
                    </>
                  ))}
                {currentStep.id === 6 &&
                  (language === "en" ? (
                    <>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Combine all 5 previous steps into one cohesive prompt</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Check: Goal clear? Role defined? Context included?</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Verify: I/O specified? Examples provided?</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Review for clarity, completeness, and specificity</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Onceki 5 adimi tek bir tutarli promptta birlestirin</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Kontrol: Hedef net mi? Rol tanimli mi? Baglam dahil mi?</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Dogrula: G/C belirtildi mi? Ornekler saglandi mi?</span>
                      </li>
                    </>
                  ))}
              </ul>
            </CardContent>
          </Card>

          {/* Example Snippet */}
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                {language === "en" ? "Example" : "Ornek"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xs font-mono bg-muted/50 rounded p-2.5 border border-border/50">
                {currentStep.id === 1 &&
                  (language === "en"
                    ? 'Create a responsive sign-in form component with email and password fields, client-side validation for email format and password strength, error messages displayed below each field, a loading spinner during submission, and a &quot;forgot password&quot; link below the submit button.'
                    : 'E-posta ve sifre alanlari, e-posta formati ve sifre guclugu icin istemci tarafi dogrulama, her alanin altinda gosterilen hata mesajlari, gonderim sirasinda yukleniyor gostergesi ve gonder butonunun altinda &quot;sifre unuttum&quot; baglantisi olan duyarli bir giris formu bileseni olusturun.')}
                {currentStep.id === 2 &&
                  (language === "en"
                    ? 'You are a senior frontend developer with 8 years of experience in React and TypeScript, specializing in building secure authentication systems and production-ready UI components.'
                    : 'React ve TypeScript\'te 8 yillik deneyime sahip kidemli bir frontend gelistiricisiniz, guvenli kimlik dogrulama sistemleri ve uretime hazir UI bilesenleri olusturmada uzmanlasmissiniz.')}
                {currentStep.id === 3 &&
                  (language === "en"
                    ? "Use React 18 with TypeScript, Tailwind CSS for styling, shadcn/ui components for the form elements, Zod for validation schema, and React Hook Form for form state management. The component should be fully responsive, support dark mode, and follow WCAG accessibility guidelines."
                    : "Stillendirme icin Tailwind CSS, form ogeleri icin shadcn/ui bilesenleri, dogrulama semasi icin Zod ve form durum yonetimi icin React Hook Form ile React 18 ve TypeScript kullanin. Bilesen tamamen duyarli olmali, karanlik modu desteklemeli ve WCAG erisilebilirlik yonergelerini takip etmelidir.")}
                {currentStep.id === 4 &&
                  (language === "en"
                    ? "Input: Accept `onSubmit: (email: string, password: string) => Promise<void>` prop and optional `onForgotPassword?: () => void`. Output: Return a single TypeScript React component file (.tsx) with proper TypeScript interfaces, internal validation logic, and no external API calls - just the form UI."
                    : "Girdi: `onSubmit: (email: string, password: string) => Promise<void>` prop'unu ve istege bagli `onForgotPassword?: () => void`'u kabul edin. Cikti: Uygun TypeScript arayuzleri, dahili dogrulama mantigi ve harici API cagrilari olmayan - sadece form UI'si - tek bir TypeScript React bilesen dosyasi (.tsx) dondurun.")}
                {currentStep.id === 5 &&
                  (language === "en"
                    ? 'Example: When a user enters a valid email (user@example.com) and password (min 8 chars), then clicks &quot;Sign In&quot;, show a loading spinner for 2 seconds, then redirect to /dashboard. If the email format is invalid, show &quot;Please enter a valid email address&quot; below the email field. If password is less than 8 characters, show &quot;Password must be at least 8 characters&quot; below the password field.'
                    : 'Ornek: Kullanici gecerli bir e-posta (user@example.com) ve sifre (min 8 karakter) girdiginde ve "Giris Yap"a tikladiginda, 2 saniye boyunca yukleniyor gostergesi gosterin, ardindan /dashboard\'a yonlendirin. E-posta formati gecersizse, e-posta alaninin altinda "Lutfen gecerli bir e-posta adresi girin" gosterin.')}
                {currentStep.id === 6 &&
                  (language === "en"
                    ? "You are a senior frontend developer with 8 years of experience in React and TypeScript, specializing in building secure authentication systems. Create a responsive sign-in form component using React 18 with TypeScript, Tailwind CSS, shadcn/ui components, Zod for validation, and React Hook Form. The component should accept `onSubmit` and optional `onForgotPassword` props, return a single .tsx file with TypeScript interfaces, and include examples of valid/invalid input handling."
                    : "Guvenli kimlik dogrulama sistemleri olusturmada uzmanlasmis, React ve TypeScript\'te 8 yillik deneyime sahip kidemli bir frontend gelistiricisiniz. TypeScript, Tailwind CSS, shadcn/ui bilesenleri, Zod ve React Hook Form ile React 18 kullanarak duyarli bir giris formu bileseni olusturun.")}
              </div>
            </CardContent>
          </Card>

          {/* Hint Toggle - Now optional since info is visible */}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5 w-full justify-start"
            onClick={() => setShowHint(!showHint)}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {showHint
              ? language === "en"
                ? "Hide additional tips"
                : "Ek ipuclarini gizle"
              : language === "en"
                ? "Show additional tips"
                : "Ek ipuclari goster"}
          </Button>

          {showHint && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-3 text-sm text-amber-800 dark:text-amber-300">
                {hint}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {language === "en" ? "Your prompt:" : "Promptunuz:"}
          </label>
          <textarea
            value={currentInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            rows={8}
            className={cn(
              "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              "resize-y min-h-[120px] font-mono"
            )}
          />
        </div>

        {/* Step Score */}
        {currentInput.trim().length > 0 && (
          <Card className="border-border">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {language === "en" ? "Step Score" : "Adim Puani"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      currentScore >= 70
                        ? "bg-green-500"
                        : currentScore >= 40
                          ? "bg-amber-500"
                          : "bg-red-400"
                    )}
                    style={{ width: `${currentScore}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-medium w-10 text-right">
                  {currentScore}%
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview of combined prompt (shown on last step) */}
        {isLastStep && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" />
                {language === "en" ? "Your Combined Prompt Preview" : "Birlesik Prompt Onizleme"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="text-xs font-mono space-y-1.5 text-muted-foreground">
                {steps.slice(0, -1).map((step) => {
                  const input = stepInputs[step.id];
                  if (!input?.trim()) return null;
                  return (
                    <div key={step.id} className="border-l-2 border-primary/30 pl-2">
                      <span className="text-primary font-medium">
                        {language === "en" ? step.titleEn : step.titleTr}:
                      </span>{" "}
                      <span className="text-foreground">
                        {input.length > 80 ? input.slice(0, 80) + "..." : input}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <div className="flex items-center justify-between p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrev}
          disabled={isFirstStep}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {language === "en" ? "Previous" : "Onceki"}
        </Button>

        <Button
          size="sm"
          onClick={handleNext}
          className="gap-1"
        >
          {isLastStep ? (
            <>
              <Trophy className="h-4 w-4" />
              {language === "en" ? "Complete" : "Tamamla"}
            </>
          ) : (
            <>
              {language === "en" ? "Next Step" : "Sonraki Adim"}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
