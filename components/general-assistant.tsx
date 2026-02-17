"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  AlertTriangle,
  Cpu,
  BookOpen,
  RotateCcw,
  X,
  Settings,
  Zap,
  Check,
  FileEdit,
  Sparkles,
  BarChart3,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { MLCEngine } from "@mlc-ai/web-llm";
import {
  isWebGPUSupported,
  isModelCached,
  initEngine,
  streamChat,
  resetEngine,
  AVAILABLE_MODELS,
  type LoadProgress,
  type ModelKey,
} from "@/components/learn-to-prompt/webllm-engine";
import { useLanguage } from "@/contexts/language-context";
import {
  tokenizeForLlama,
  parsePromptAnatomy,
  scorePromptMatrix,
  getPromptSuggestions,
  type TokenInfo,
  type PromptMatrixScore,
  type PromptSuggestion,
} from "@/lib/prompt-tokenizer";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface GeneralAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const CUSTOM_PROMPT_STORAGE_KEY = "ai-assistant-system-prompt";
const CUSTOM_ORDERS_STORAGE_KEY = "ai-assistant-custom-orders";

// Default system prompt (language-agnostic instructions)
const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant that helps people with everyday questions, coding, software development, and general knowledge.

You can help with:
- Programming and coding questions (JavaScript, TypeScript, Python, React, etc.)
- Software development problems and debugging
- General knowledge and explanations
- Daily life questions and advice
- Learning new concepts
- Problem-solving

Be friendly, concise (3-6 sentences), and practical. Provide code examples when relevant. Answer directly and helpfully.`;

// Prompt templates for rich planning experience
const PROMPT_TEMPLATES: Record<string, { en: string; tr: string }> = {
  general: {
    en: DEFAULT_SYSTEM_PROMPT,
    tr: `Gundelik sorular, kodlama, yazilim gelistirme ve genel bilgi konusunda yardimci olan yardimsever bir AI asistansiniz.
Yardimci olabileceginiz konular: Programlama, yazilim gelistirme, genel bilgi, problem cozme.
Dostca, oz ve pratik olun. Kod ornekleri verin.`,
  },
  coding: {
    en: `You are an expert coding assistant. Focus on:
- Clean, production-ready code
- Best practices and design patterns
- Debugging and performance
- Multiple languages: JS, TS, Python, Go, Rust
Be precise, include code examples. Explain trade-offs.`,
    tr: `Uzman bir kodlama asistansiniz. Odak: Temiz kod, en iyi uygulamalar, hata ayiklama, performans.
JS, TS, Python, Go, Rust destegi. Kesin olun, kod ornekleri verin.`,
  },
  tutor: {
    en: `You are a patient tutor. Explain concepts step-by-step.
- Start simple, add complexity gradually
- Use analogies and examples
- Encourage questions
- Adapt to the learner's level`,
    tr: `Sabirli bir ogretmensiniz. Kavramlari adim adim aciklayin.
Basit baslayin, kademeli zorlastirin. Analojiler kullanin. Sorulara tesvik edin.`,
  },
  creative: {
    en: `You are a creative assistant. Help with:
- Writing, brainstorming, ideation
- Storytelling and content creation
- Design thinking
Be imaginative, suggest alternatives, think outside the box.`,
    tr: `Yaratici bir asistansiniz. Yazma, fikir uretme, icerik olusturma, tasarim dusuncesi.
Hayal gucu kullanin, alternatifler onerin.`,
  },
};

// General-purpose system prompt for everyday questions
function buildGeneralSystemPrompt(language: "en" | "tr"): string {
  return language === "en"
    ? DEFAULT_SYSTEM_PROMPT
    : `Gundelik sorular, kodlama, yazilim gelistirme ve genel bilgi konusunda yardimci olan yardimsever bir AI asistansiniz.

Yardimci olabileceginiz konular:
- Programlama ve kodlama sorulari (JavaScript, TypeScript, Python, React, vb.)
- Yazilim gelistirme problemleri ve hata ayiklama
- Genel bilgi ve aciklamalar
- Gundelik hayat sorulari ve tavsiyeler
- Yeni kavramlar ogrenme
- Problem cozme

Dostca, oz (3-6 cumle) ve pratik olun. Ilgili oldugunda kod ornekleri verin. Dogrudan ve yardimci sekilde cevap verin.`;
}

export function GeneralAssistant({ isOpen, onClose }: GeneralAssistantProps) {
  const { language } = useLanguage();
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [webGPUAvailable, setWebGPUAvailable] = useState(true);
  const [cached, setCached] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [useBuiltIn, setUseBuiltIn] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelKey | null>(null);
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCorePromptDialog, setShowCorePromptDialog] = useState(false);
  const [pendingModelSwitch, setPendingModelSwitch] = useState<ModelKey | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [promptDraft, setPromptDraft] = useState<string>("");
  const [customOrders, setCustomOrders] = useState<string>("");
  const [showAnalyzerDialog, setShowAnalyzerDialog] = useState(false);
  const [analyzerTokens, setAnalyzerTokens] = useState<TokenInfo[]>([]);
  const [analyzerTotal, setAnalyzerTotal] = useState(0);
  const [analyzerLoading, setAnalyzerLoading] = useState(false);
  const [anatomyColorize, setAnatomyColorize] = useState(true);
  const [matrixScore, setMatrixScore] = useState<PromptMatrixScore | null>(null);
  const [promptSuggestions, setPromptSuggestions] = useState<PromptSuggestion[]>([]);
  const [analyzedPromptText, setAnalyzedPromptText] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check WebGPU support on mount
  useEffect(() => {
    const supported = isWebGPUSupported();
    setWebGPUAvailable(supported);
    if (!supported) {
      setUseBuiltIn(true);
    }
  }, []);

  // Load custom prompt and orders from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CUSTOM_PROMPT_STORAGE_KEY);
    const savedOrders = localStorage.getItem(CUSTOM_ORDERS_STORAGE_KEY);
    if (saved) {
      setCustomPrompt(saved);
      setPromptDraft(saved);
    } else {
      setCustomPrompt("");
      setPromptDraft(buildGeneralSystemPrompt(language));
    }
    setCustomOrders(savedOrders || "");
  }, [isOpen, language]);

  // Sync promptDraft when opening settings or core prompt dialog
  useEffect(() => {
    if (showSettings || showCorePromptDialog) {
      setPromptDraft(customPrompt || buildGeneralSystemPrompt(language));
    }
  }, [showSettings, showCorePromptDialog, customPrompt, language]);

  // Check if model is selected (from localStorage)
  useEffect(() => {
    if (isOpen && selectedModel === null) {
      const savedModel = localStorage.getItem("ai-assistant-model") as ModelKey | null;
      if (savedModel && (savedModel === "smol" || savedModel === "llama")) {
        setSelectedModel(savedModel);
        isModelCached(AVAILABLE_MODELS[savedModel].id).then(setCached);
      } else {
        // First time - show model selection
        setShowModelSelection(true);
      }
    }
  }, [isOpen, selectedModel]);

  // Add welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg =
        language === "en"
          ? `Hello! I'm your AI assistant. I can help you with:\n\n• Coding and programming questions\n• Software development problems\n• General knowledge\n• Daily life questions\n\nAsk me anything!`
          : `Merhaba! Ben AI asistaninizim. Size yardimci olabilecegim konular:\n\n• Kodlama ve programlama sorulari\n• Yazilim gelistirme problemleri\n• Genel bilgi\n• Gundelik hayat sorulari\n\nBana herhangi bir sey sorabilirsiniz!`;

      setMessages([{ role: "assistant", content: welcomeMsg }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, language]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle model selection
  const handleSelectModel = useCallback((modelKey: ModelKey) => {
    setSelectedModel(modelKey);
    setShowModelSelection(false);
    localStorage.setItem("ai-assistant-model", modelKey);
    isModelCached(AVAILABLE_MODELS[modelKey].id).then(setCached);
  }, []);

  // Initialize engine
  const handleInitEngine = useCallback(async () => {
    if (!selectedModel || engine || isLoading) return;
    setIsLoading(true);
    setInitError(null);

    try {
      const e = await initEngine(
        (progress) => {
          setLoadProgress(progress);
        },
        selectedModel
      );
      setEngine(e);
      setUseBuiltIn(false);
    } catch (err) {
      console.error("Failed to init engine:", err);
      setInitError(
        err instanceof Error ? err.message : "Failed to load AI model"
      );
      setUseBuiltIn(true);
    } finally {
      setIsLoading(false);
      setLoadProgress(null);
    }
  }, [engine, isLoading, selectedModel]);

  // Switch model - opens confirmation dialog
  const handleSwitchModel = useCallback((newModel: ModelKey) => {
    // If switching to the same model, do nothing
    if (newModel === selectedModel) {
      setShowSettings(false);
      return;
    }
    setPendingModelSwitch(newModel);
  }, [selectedModel]);

  // Confirm model switch
  const handleConfirmModelSwitch = useCallback(async () => {
    if (!pendingModelSwitch) return;

    const newModel = pendingModelSwitch;
    setPendingModelSwitch(null);
    setShowSettings(false);

    // Reset engine if running
    if (engine) {
      resetEngine();
      setEngine(null);
      setMessages([]);
    }

    // Update model
    setSelectedModel(newModel);
    localStorage.setItem("ai-assistant-model", newModel);
    isModelCached(AVAILABLE_MODELS[newModel].id).then(setCached);
  }, [pendingModelSwitch, engine]);

  // Cancel model switch
  const handleCancelModelSwitch = useCallback(() => {
    setPendingModelSwitch(null);
  }, []);

  // Start with built-in helper
  const handleStartBuiltIn = useCallback(() => {
    setUseBuiltIn(true);
  }, []);

  // Get effective system prompt (core + custom orders)
  const getEffectiveSystemPrompt = useCallback(() => {
    const core = customPrompt.trim() || buildGeneralSystemPrompt(language);
    const orders = customOrders.trim();
    return orders ? `${core}\n\n**Additional instructions:**\n${orders}` : core;
  }, [customPrompt, customOrders, language]);

  // Reset chat
  const handleResetChat = useCallback(() => {
    const welcomeMsg =
      language === "en"
        ? `Hello! I'm your AI assistant. I can help you with:\n\n• Coding and programming questions\n• Software development problems\n• General knowledge\n• Daily life questions\n\nAsk me anything!`
        : `Merhaba! Ben AI asistaninizim. Size yardimci olabilecegim konular:\n\n• Kodlama ve programlama sorulari\n• Yazilim gelistirme problemleri\n• Genel bilgi\n• Gundelik hayat sorulari\n\nBana herhangi bir sey sorabilirsiniz!`;

    setMessages([{ role: "assistant", content: welcomeMsg }]);
    setInputValue("");
  }, [language]);

  // Apply custom prompt and re-prompt (reset chat with new prompt)
  const handleApplyPrompt = useCallback(() => {
    const trimmed = promptDraft.trim();
    if (trimmed) {
      setCustomPrompt(trimmed);
      localStorage.setItem(CUSTOM_PROMPT_STORAGE_KEY, trimmed);
    } else {
      setCustomPrompt("");
      localStorage.removeItem(CUSTOM_PROMPT_STORAGE_KEY);
    }
    localStorage.setItem(CUSTOM_ORDERS_STORAGE_KEY, customOrders.trim());
    handleResetChat();
    setShowSettings(false);
    setShowCorePromptDialog(false);
  }, [promptDraft, customOrders, handleResetChat]);

  // Analyze prompt anatomy (token table for Llama)
  const handleAnalyzePrompt = useCallback(async () => {
    const core = promptDraft.trim() || buildGeneralSystemPrompt(language);
    const orders = customOrders.trim();
    const fullPrompt = orders ? `${core}\n\n**Additional instructions:**\n${orders}` : core;
    setShowAnalyzerDialog(true);
    setAnalyzerLoading(true);
    setAnalyzedPromptText(fullPrompt);
    setMatrixScore(scorePromptMatrix(fullPrompt));
    setPromptSuggestions(getPromptSuggestions(fullPrompt, language));
    try {
      const { tokens, totalTokens } = await tokenizeForLlama(fullPrompt);
      setAnalyzerTokens(tokens);
      setAnalyzerTotal(totalTokens);
    } catch {
      setAnalyzerTokens([]);
      setAnalyzerTotal(Math.ceil(fullPrompt.length / 4));
    } finally {
      setAnalyzerLoading(false);
    }
  }, [promptDraft, customOrders, language]);

  // Apply suggestion to prompt (insert template, switch to core prompt dialog)
  const handleApplySuggestion = useCallback((insertTemplate: string, id: string) => {
    if (id === "role") {
      setPromptDraft((prev) => insertTemplate + (prev || ""));
    } else {
      setPromptDraft((prev) => (prev || "").trimEnd() + insertTemplate);
    }
    setShowAnalyzerDialog(false);
    setShowCorePromptDialog(true);
  }, []);

  // Replace core prompt with template
  const handleInsertTemplate = useCallback((key: string) => {
    const t = PROMPT_TEMPLATES[key];
    const text = t ? (t[language] || t.en) : "";
    setPromptDraft(text);
  }, [language]);

  // Reset prompt to default
  const handleResetPromptToDefault = useCallback(() => {
    setCustomPrompt("");
    setPromptDraft(buildGeneralSystemPrompt(language));
    localStorage.removeItem(CUSTOM_PROMPT_STORAGE_KEY);
  }, [language]);

  // Send message
  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    // If engine is available, use LLM
    if (engine) {
      setIsStreaming(true);
      const assistantMsg: ChatMessage = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      const systemPrompt = getEffectiveSystemPrompt();
      const recentMessages = [...messages.slice(-6), userMsg];

      try {
        await streamChat(engine, systemPrompt, recentMessages, (_token, fullText) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: fullText,
            };
            return updated;
          });
        });
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content:
              language === "en"
                ? "Sorry, I encountered an error. Please try again."
                : "Uzgunum, bir hata olustu. Lutfen tekrar deneyin.",
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    } else {
      // Built-in response
      const response =
        language === "en"
          ? `I'd love to help! For detailed answers with code examples, please load the AI model using the "Download & Start" button above.\n\nThe AI can provide comprehensive help with coding, development, and general questions.`
          : `Yardimci olmak isterim! Kod ornekleriyle detayli cevaplar icin lutfen yukaridaki "Indir ve Baslat" butonunu kullanarak AI modelini yukleyin.\n\nAI kodlama, gelistirme ve genel sorular konusunda kapsamli yardim saglayabilir.`;

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response },
        ]);
      }, 400);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const currentModelName = selectedModel
    ? AVAILABLE_MODELS[selectedModel].name
    : language === "en"
      ? "Built-in Helper"
      : "Dahili Yardimci";
  const pendingModelName = pendingModelSwitch
    ? AVAILABLE_MODELS[pendingModelSwitch].name
    : "";

  return (
    <>
      {/* Model Switch Confirmation Dialog */}
      <Dialog open={pendingModelSwitch !== null} onOpenChange={(open) => !open && handleCancelModelSwitch()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "en" ? "Switch AI Model?" : "AI Modelini Degistir?"}
            </DialogTitle>
            <DialogDescription>
              {language === "en"
                ? `You are about to switch from ${currentModelName} to ${pendingModelName}. This will reset your current chat session.`
                : `${currentModelName} modelinden ${pendingModelName} modeline gececeksiniz. Bu, mevcut sohbet oturumunuzu sifirlayacaktir.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelModelSwitch}>
              {language === "en" ? "Cancel" : "Iptal"}
            </Button>
            <Button onClick={handleConfirmModelSwitch}>
              {language === "en" ? "Switch Model" : "Modeli Degistir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Core Prompt Dialog - Comprehensive LLM Planning */}
      <Dialog open={showCorePromptDialog} onOpenChange={setShowCorePromptDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {language === "en" ? "Core Prompt" : "Core Prompt Ayarla"}
            </DialogTitle>
            <DialogDescription>
              {language === "en"
                ? "Plan and customize the LLM system instructions. Define the AI's role, capabilities, and behavior. Apply to restart the chat with your new prompt."
                : "LLM sistem talimatlarini planlayin ve ozellestirin. AI'nin rolunu, yeteneklerini ve davranisini tanimlayin. Uygulayarak sohbeti yeni prompt ile yeniden baslatin."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col gap-4 min-h-0">
            {/* Quick templates - replace core prompt */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {language === "en" ? "Templates (replace core prompt):" : "Sablonlar (core promptu degistirir):"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsertTemplate("general")}
                  className="text-xs"
                >
                  {language === "en" ? "General" : "Genel"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsertTemplate("coding")}
                  className="text-xs"
                >
                  {language === "en" ? "Coding" : "Kodlama"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsertTemplate("tutor")}
                  className="text-xs"
                >
                  {language === "en" ? "Tutor" : "Tutor"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsertTemplate("creative")}
                  className="text-xs"
                >
                  {language === "en" ? "Creative" : "Yaratici"}
                </Button>
              </div>
            </div>
            {/* Core prompt editor */}
            <div className="flex-1 min-h-[200px] flex flex-col">
              <label className="text-xs font-medium text-muted-foreground mb-1">
                {language === "en" ? "Core prompt" : "Temel prompt"}
              </label>
              <textarea
                value={promptDraft}
                onChange={(e) => setPromptDraft(e.target.value)}
                placeholder={DEFAULT_SYSTEM_PROMPT}
                className="min-h-[180px] w-full rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y font-mono leading-relaxed"
                spellCheck={false}
              />
            </div>
            {/* Custom prompts and orders */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {language === "en" ? "Custom prompts & orders (appended to core)" : "Ozel promptlar ve talimatlar (core'a eklenir)"}
              </label>
              <textarea
                value={customOrders}
                onChange={(e) => setCustomOrders(e.target.value)}
                placeholder={language === "en" ? "e.g. Always respond in bullet points. Use code blocks for snippets." : "Ornek: Her zaman madde isaretleriyle cevap ver. Kod icin code block kullan."}
                rows={3}
                className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleAnalyzePrompt} disabled={analyzerLoading}>
              <BarChart3 className="h-4 w-4 mr-2" />
              {analyzerLoading
                ? (language === "en" ? "Analyzing..." : "Analiz ediliyor...")
                : (language === "en" ? "Analyze anatomy" : "Anatomi analizi")}
            </Button>
            <Button variant="outline" onClick={handleResetPromptToDefault}>
              {language === "en" ? "Reset to Default" : "Varsayilana Sifirla"}
            </Button>
            <Button onClick={handleApplyPrompt}>
              {language === "en" ? "Apply & Re-prompt" : "Uygula ve Yeniden Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prompt Anatomy Analyzer Dialog */}
      <Dialog open={showAnalyzerDialog} onOpenChange={setShowAnalyzerDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {language === "en" ? "Prompt Anatomy" : "Prompt Anatomisi"}
            </DialogTitle>
            <DialogDescription>
              {language === "en"
                ? "Token breakdown (Llama tokenizer), matrix score, colorized anatomy, and prompt engineering suggestions with explanations."
                : "Token dagilimi (Llama tokenizer), matris skoru, renkli anatomi ve aciklamali prompt muhendisligi onerileri."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto min-h-0 space-y-4">
            {/* Missing point suggestions for prompt engineering */}
            {promptSuggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">
                  {language === "en" ? "Prompt engineering suggestions" : "Prompt muhendisligi onerileri"}
                </h4>
                <div className="space-y-2">
                  {promptSuggestions.map((s) => (
                    <details
                      key={s.id}
                      className={cn(
                        "group rounded-lg border p-3 [&_summary::-webkit-details-marker]:hidden",
                        s.missing ? "border-amber-500/40 bg-amber-500/5" : "border-green-500/30 bg-green-500/5"
                      )}
                    >
                      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium list-none [&::-webkit-details-marker]:hidden">
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs",
                            s.missing ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" : "bg-green-500/20 text-green-700 dark:text-green-400"
                          )}
                        >
                          {s.missing ? "!" : "✓"}
                        </span>
                        <span className="flex-1">{s.suggestion}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs shrink-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleApplySuggestion(s.insertTemplate, s.id);
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          {language === "en" ? "Apply" : "Uygula"}
                        </Button>
                        <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                      </summary>
                      <p className="mt-2 pl-7 text-xs text-muted-foreground leading-relaxed">{s.explanation}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Matrix Score */}
            {matrixScore && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { key: "overall", label: language === "en" ? "Overall" : "Genel", value: matrixScore.overall },
                  { key: "clarity", label: language === "en" ? "Clarity" : "Netlik", value: matrixScore.clarity },
                  { key: "specificity", label: language === "en" ? "Specificity" : "Ozgulluk", value: matrixScore.specificity },
                  { key: "length", label: language === "en" ? "Length" : "Uzunluk", value: matrixScore.length },
                  { key: "structure", label: language === "en" ? "Structure" : "Yapi", value: matrixScore.structure },
                  { key: "completeness", label: language === "en" ? "Complete" : "Tamlik", value: matrixScore.completeness },
                ].map(({ key, label, value }) => (
                  <div key={key} className="p-2 rounded-lg border border-border bg-muted/30">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className={cn(
                      "text-lg font-bold",
                      value >= 80 ? "text-green-600 dark:text-green-400" : value >= 60 ? "text-yellow-600 dark:text-yellow-400" : "text-orange-600 dark:text-orange-400"
                    )}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Colorize toggle + Anatomy view */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={anatomyColorize}
                  onChange={(e) => setAnatomyColorize(e.target.checked)}
                  className="rounded border-border"
                />
                {language === "en" ? "Colorize anatomy" : "Anatomi renklendir"}
              </label>
                {anatomyColorize && (
                  <span className="text-[10px] text-muted-foreground">
                    {language === "en" ? "Blue=role · Green=instruction · Amber=constraint · Violet=header · Cyan=list · Rose=example" : "Mavi=rol · Yesil=talimat · Amber=kisitlama · Mor=baslik · Cyan=liste · Pembe=ornek"}
                  </span>
                )}
              </div>
              {anatomyColorize && analyzedPromptText && (
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm font-mono leading-relaxed overflow-x-auto">
                  {parsePromptAnatomy(analyzedPromptText).map((seg, i) => (
                    <span
                      key={i}
                      className={cn(
                        "whitespace-pre-wrap",
                        seg.type === "role" && "bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1 rounded",
                        seg.type === "instruction" && "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1 rounded",
                        seg.type === "constraint" && "bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1 rounded",
                        seg.type === "header" && "bg-violet-500/20 text-violet-700 dark:text-violet-300 px-1 rounded font-semibold",
                        seg.type === "list" && "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 px-1 rounded",
                        seg.type === "example" && "bg-rose-500/15 text-rose-700 dark:text-rose-300 px-1 rounded",
                        seg.type === "text" && !seg.text.trim() && "block h-2",
                        seg.type === "text" && seg.text.trim() && "text-foreground"
                      )}
                    >
                      {seg.text}
                      {seg.text !== "\n" && i < parsePromptAnatomy(analyzedPromptText).length - 1 ? "\n" : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Token table */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {language === "en" ? "Total tokens: " : "Toplam token: "}
                  <span className="font-mono">{analyzerTotal}</span>
                </span>
              </div>
              <div className="border rounded-lg overflow-hidden max-h-[240px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/80 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">#</th>
                      <th className="px-3 py-2 text-left font-medium">{language === "en" ? "Token ID" : "Token ID"}</th>
                      <th className="px-3 py-2 text-left font-medium">{language === "en" ? "Token" : "Token"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analyzerTokens.slice(0, 100).map((t) => (
                      <tr key={t.index} className="hover:bg-muted/30">
                        <td className="px-3 py-1.5 font-mono text-muted-foreground">{t.index}</td>
                        <td className="px-3 py-1.5 font-mono">{t.tokenId}</td>
                        <td className="px-3 py-1.5 break-all font-mono text-xs">{t.token || " "}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {analyzerTokens.length > 100 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "en" ? `Showing first 100 of ${analyzerTokens.length} tokens` : `Ilk 100 / ${analyzerTokens.length} token`}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-background border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-medium">
          {language === "en" ? "AI Assistant" : "AI Asistan"}
        </span>
        <Badge variant="outline" className="text-[10px] h-4 px-1 ml-auto">
          {selectedModel
            ? AVAILABLE_MODELS[selectedModel].name
            : language === "en"
              ? "Built-in"
              : "Dahili"}
        </Badge>
        <div className="flex items-center gap-1 ml-2">
          {/* Core Prompt Button */}
          <button
            onClick={() => setShowCorePromptDialog(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            title={language === "en" ? "Set Core Prompt" : "Core Prompt Ayarla"}
          >
            <FileEdit className="h-4 w-4" />
          </button>
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            title={language === "en" ? "Settings" : "Ayarlar"}
          >
            <Settings className="h-4 w-4" />
          </button>
          {/* Reset Chat Button */}
          {messages.length > 1 && (
            <button
              onClick={handleResetChat}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              title={language === "en" ? "Reset chat" : "Sohbeti sifirla"}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            aria-label={language === "en" ? "Close" : "Kapat"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-border bg-muted/10 p-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">
              {language === "en" ? "Model Settings" : "Model Ayarlari"}
            </h3>
            <div className="grid gap-2">
              {(Object.keys(AVAILABLE_MODELS) as ModelKey[]).map((modelKey) => {
                const model = AVAILABLE_MODELS[modelKey];
                const isSelected = selectedModel === modelKey;
                return (
                  <button
                    key={modelKey}
                    onClick={() => handleSwitchModel(modelKey)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{model.name}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {model.description[language]}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {model.capabilities[language].map((cap, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {cap}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {language === "en" ? "Size" : "Boyut"}: {model.size}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => {
                setShowSettings(false);
                setShowCorePromptDialog(true);
              }}
            >
              <FileEdit className="h-3.5 w-3.5 mr-2" />
              {language === "en" ? "Set Core Prompt" : "Core Prompt Ayarla"}
            </Button>
          </div>
        </div>
      )}

      {/* Model Selection Screen (First Time) */}
      {showModelSelection && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">
                {language === "en"
                  ? "Choose Your AI Model"
                  : "AI Modelinizi Secin"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === "en"
                  ? "Select a model based on your needs. You can change this later in settings."
                  : "Ihtiyaciniza gore bir model secin. Bunu daha sonra ayarlardan degistirebilirsiniz."}
              </p>
            </div>

            <div className="grid gap-4">
              {(Object.keys(AVAILABLE_MODELS) as ModelKey[]).map((modelKey) => {
                const model = AVAILABLE_MODELS[modelKey];
                return (
                  <Card
                    key={modelKey}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
                      selectedModel === modelKey && "border-primary"
                    )}
                    onClick={() => handleSelectModel(modelKey)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{model.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {model.size}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {model.description[language]}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div>
                        <p className="text-xs font-medium mb-2 text-muted-foreground">
                          {language === "en" ? "Capabilities:" : "Yetenekler:"}
                        </p>
                        <ul className="space-y-1.5">
                          {model.capabilities[language].map((cap, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-muted-foreground"
                            >
                              <Zap className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                              <span>{cap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button
              onClick={() => {
                setUseBuiltIn(true);
                setShowModelSelection(false);
              }}
              variant="outline"
              className="w-full"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {language === "en"
                ? "Use Built-in Helper (No Download)"
                : "Dahili Yardimci Kullan (Indirme Yok)"}
            </Button>
          </div>
        </div>
      )}

      {/* Engine not loaded */}
      {!showModelSelection &&
        !engine &&
        !isLoading &&
        !useBuiltIn &&
        selectedModel && (
        <div className="flex flex-col items-center justify-center p-6 text-center gap-3 flex-1">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Cpu className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">
              {language === "en" ? "AI Assistant" : "AI Asistan"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {cached
                ? language === "en"
                  ? "Model is cached. Click to start instantly."
                  : "Model onbellekte. Aninda baslamak icin tiklayin."
                : language === "en"
                  ? `Download ${AVAILABLE_MODELS[selectedModel].name} (${AVAILABLE_MODELS[selectedModel].size}) for comprehensive help.`
                  : `Kapsamli yardim icin ${AVAILABLE_MODELS[selectedModel].name} (${AVAILABLE_MODELS[selectedModel].size}) indirin.`}
            </p>
          </div>

          {webGPUAvailable && (
            <Button onClick={handleInitEngine} className="gap-2 w-full max-w-[200px]">
              <Bot className="h-4 w-4" />
              {cached
                ? language === "en"
                  ? "Start AI Model"
                  : "AI Modeli Baslat"
                : language === "en"
                  ? "Download & Start"
                  : "Indir ve Baslat"}
            </Button>
          )}

          {!webGPUAvailable && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {language === "en"
                ? "WebGPU not available"
                : "WebGPU mevcut degil"}
            </div>
          )}

          <Button
            onClick={handleStartBuiltIn}
            variant="outline"
            className="gap-2 w-full max-w-[200px]"
          >
            <BookOpen className="h-4 w-4" />
            {language === "en"
              ? "Use Built-in Helper"
              : "Dahili Yardimci Kullan"}
          </Button>

          {initError && (
            <p className="text-xs text-destructive max-w-xs">{initError}</p>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && loadProgress && (
        <div className="flex flex-col items-center justify-center p-6 text-center gap-4 flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="w-full max-w-sm space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">{loadProgress.text}</p>
              {loadProgress.fileSize && (
                <p className="text-xs text-muted-foreground">
                  {loadProgress.fileSize}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    loadProgress.stage === "downloading"
                      ? "bg-primary"
                      : "bg-green-500"
                  )}
                  style={{
                    width: `${Math.round(loadProgress.progress * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {Math.round(loadProgress.progress * 100)}%
                </span>
                {loadProgress.estimatedTimeRemaining && (
                  <span className="text-muted-foreground">
                    {loadProgress.estimatedTimeRemaining}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat UI */}
      {!showModelSelection &&
        (!isLoading || !loadProgress) &&
        (engine || useBuiltIn) && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                    {isStreaming &&
                      i === messages.length - 1 &&
                      msg.role === "assistant" && (
                        <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 animate-pulse" />
                      )}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  language === "en"
                    ? "Ask me anything..."
                    : "Bana herhangi bir sey sorun..."
                }
                rows={1}
                disabled={isStreaming}
                className={cn(
                  "flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm",
                  "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30",
                  "resize-none min-h-[36px] max-h-[80px]"
                )}
              />
              <Button
                size="icon"
                className="h-9 w-9 flex-shrink-0"
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
}
