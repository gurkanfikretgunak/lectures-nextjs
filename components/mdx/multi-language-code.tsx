"use client";

import { useState, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface CodeExample {
  language: string;
  code: string;
  label: string;
}

interface MultiLanguageCodeProps {
  python?: string;
  typescript?: string;
  csharp?: string;
  dart?: string;
  title?: string;
}

const languageConfig: Record<string, { label: string; extension: string; highlightLang: string }> = {
  python: { label: "Python", extension: "py", highlightLang: "python" },
  typescript: { label: "TypeScript", extension: "ts", highlightLang: "typescript" },
  csharp: { label: "C#", extension: "cs", highlightLang: "csharp" },
  dart: { label: "Dart", extension: "dart", highlightLang: "dart" },
};

export function MultiLanguageCode({
  python,
  typescript,
  csharp,
  dart,
  title,
}: MultiLanguageCodeProps) {
  const { t } = useLanguage();

  const codeExamples: CodeExample[] = [
    python && { language: "python", code: python, label: languageConfig.python.label },
    typescript && { language: "typescript", code: typescript, label: languageConfig.typescript.label },
    csharp && { language: "csharp", code: csharp, label: languageConfig.csharp.label },
    dart && { language: "dart", code: dart, label: languageConfig.dart.label },
  ].filter(Boolean) as CodeExample[];

  // Set default selected language to first available language
  const defaultLanguage = codeExamples.length > 0 ? codeExamples[0].language as keyof typeof languageConfig : "python";
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof languageConfig>(defaultLanguage);
  const [copied, setCopied] = useState(false);

  const currentCode = codeExamples.find((ex) => ex.language === selectedLanguage)?.code || "";

  // Use useEffect to update selected language if current selection is not available
  useEffect(() => {
    if (codeExamples.length > 0 && !codeExamples.find(ex => ex.language === selectedLanguage)) {
      setSelectedLanguage(defaultLanguage);
    }
  }, [codeExamples, selectedLanguage, defaultLanguage]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Don't render if no code examples
  if (codeExamples.length === 0) {
    return (
      <div className="my-6 p-4 border border-destructive/50 bg-destructive/10 rounded-lg text-destructive text-sm">
        <p>No code examples provided for MultiLanguageCode component.</p>
      </div>
    );
  }

  return (
    <div className="my-6">
      {/* Language selector badges */}
      <div className="mb-2 flex items-center gap-2 flex-wrap">
        {title ? (
          <span className="text-xs text-muted-foreground font-medium">{title}:</span>
        ) : (
          <span className="text-xs text-muted-foreground font-medium">{t("selectLanguage")}:</span>
        )}
        {codeExamples.map((example) => (
          <Badge
            key={example.language}
            variant={selectedLanguage === example.language ? "default" : "outline"}
            role="button"
            tabIndex={0}
            className={cn(
              "cursor-pointer transition-all text-xs px-2 py-0.5 select-none",
              selectedLanguage === example.language
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "bg-background hover:bg-muted/80 text-foreground border-border"
            )}
            onClick={() => setSelectedLanguage(example.language as keyof typeof languageConfig)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedLanguage(example.language as keyof typeof languageConfig);
              }
            }}
          >
            {example.label}
          </Badge>
        ))}
      </div>

      {/* Code blocks - render all and show/hide */}
      {codeExamples.map((example) => {
        const isSelected = selectedLanguage === example.language;
        const langConfig = languageConfig[example.language as keyof typeof languageConfig];
        
        return (
          <div
            key={example.language}
            className={cn(
              "relative group",
              isSelected ? "block" : "hidden"
            )}
          >
            <div className="absolute top-0 left-4 -translate-y-1/2 px-2 py-0.5 text-xs font-mono bg-background border border-border rounded text-muted-foreground z-10 shadow-sm">
              {langConfig.extension}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/80 backdrop-blur-sm"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            <pre
              className={cn(
                "overflow-x-auto rounded-lg border border-border bg-muted/50 dark:bg-muted p-4 pt-6 font-mono text-sm"
              )}
              data-language={langConfig.highlightLang}
            >
              <code className={cn(
                `language-${langConfig.highlightLang}`,
                "text-foreground dark:text-[#e6edf3] text-[#24292f]"
              )}>
                {example.code}
              </code>
            </pre>
          </div>
        );
      })}
    </div>
  );
}
