"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  AlertTriangle,
  Cpu,
  Lightbulb,
  Zap,
  HelpCircle,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MLCEngine } from "@mlc-ai/web-llm";
import {
  isWebGPUSupported,
  isModelCached,
  initEngine,
  streamChat,
  buildSystemPrompt,
  type LoadProgress,
} from "./webllm-engine";
import type { SimulationStep } from "./simulation-data";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AssistantChatProps {
  simulationTitle: string;
  currentStep: SimulationStep;
  userPromptDraft: string;
  language: "en" | "tr";
}

// ─── Quick suggestion chips per step ───
const STEP_SUGGESTIONS: Record<number, { en: string[]; tr: string[] }> = {
  1: {
    en: [
      "How do I define a clear goal?",
      "Give me an example goal",
      "What makes a good prompt goal?",
      "Help me get started",
    ],
    tr: [
      "Net bir hedefi nasil tanimlayabilirim?",
      "Bana bir ornek hedef ver",
      "Iyi bir prompt hedefi nedir?",
      "Baslamama yardim et",
    ],
  },
  2: {
    en: [
      "What roles work best?",
      "Give me a role example",
      "Why should I set a role?",
      "Is my role specific enough?",
    ],
    tr: [
      "En iyi roller hangileri?",
      "Bana bir rol ornegi ver",
      "Neden rol belirlemeliyim?",
      "Rolum yeterince spesifik mi?",
    ],
  },
  3: {
    en: [
      "What context should I include?",
      "How to specify tech stack?",
      "Give me a context example",
      "What constraints matter most?",
    ],
    tr: [
      "Hangi baglami eklemeliyim?",
      "Teknoloji yiginini nasil belirtmeliyim?",
      "Bana baglam ornegi ver",
      "Hangi kisitlamalar onemli?",
    ],
  },
  4: {
    en: [
      "How to define input/output?",
      "What format should output be?",
      "Give me an I/O example",
      "What props should I specify?",
    ],
    tr: [
      "Girdi/ciktiyi nasil tanimlamaliyim?",
      "Cikti formati ne olmali?",
      "Bana bir G/C ornegi ver",
      "Hangi props belirtmeliyim?",
    ],
  },
  5: {
    en: [
      "What makes good examples?",
      "Show me an example pattern",
      "How many examples do I need?",
      "Help me write user flow examples",
    ],
    tr: [
      "Iyi ornekler nasil olur?",
      "Bana ornek kalip goster",
      "Kac ornege ihtiyacim var?",
      "Kullanici akisi ornekleri yazmama yardim et",
    ],
  },
  6: {
    en: [
      "Review my full prompt",
      "What am I missing?",
      "How can I make it better?",
      "Is this prompt complete?",
    ],
    tr: [
      "Tam promptumu incele",
      "Neler eksik?",
      "Nasil daha iyi yapabilirim?",
      "Bu prompt tamam mi?",
    ],
  },
};

// ─── General prompt engineering tips (no model needed) ───
const GENERAL_TIPS: { en: string[]; tr: string[] } = {
  en: [
    "Be specific about what you want - vague prompts give vague results.",
    "Assign a role: 'You are a senior React developer' focuses the AI's expertise.",
    "Include tech stack constraints: framework, language, styling approach, libraries.",
    "Define the expected output format: single file, multiple files, just the component, with types, etc.",
    "Provide examples of what good output looks like - this is the most powerful technique.",
    "Iterate: test your prompt, see what's missing, and refine it.",
    "Break complex requests into steps - just like this simulation teaches you!",
    "Use delimiters (like triple backticks) to separate instructions from data/examples.",
    "Specify what NOT to do - constraints prevent unwanted patterns in the output.",
    "Ask the AI to think step-by-step for complex logic or architecture decisions.",
  ],
  tr: [
    "Ne istediginiz konusunda spesifik olun - belirsiz promptlar belirsiz sonuclar verir.",
    "Rol atayin: 'Kdemli bir React gelistiricisiniz' AI'nin uzmanligini odaklar.",
    "Teknoloji yigini kisitlamalarini ekleyin: framework, dil, stillendirme, kutuphaneler.",
    "Beklenen cikti formatini tanimlayin: tek dosya, birden cok dosya, sadece bilesen, tiplerle, vb.",
    "Iyi ciktinin nasil gorunecegine dair ornekler verin - bu en guclu tekniktir.",
    "Tekrarlayin: promptunuzu test edin, eksikleri gorun ve iyilestirin.",
    "Karmasik istekleri adimlara bolun - tam bu simulasyonun ogretti gibi!",
    "Talimatlari veri/orneklerden ayirmak icin sinirlandiricilar kullanin.",
    "Ne YAPILMAMASI gerektigini belirtin - kisitlamalar istenmeyen kaliplari onler.",
    "Karmasik mantik icin AI'dan adim adim dusunmesini isteyin.",
  ],
};

// ─── Built-in responses for when no model is available ───
function getBuiltInResponse(
  stepId: number,
  question: string,
  language: "en" | "tr"
): string {
  const q = question.toLowerCase();

  // Step 1 - Goal
  if (stepId === 1) {
    if (q.includes("example") || q.includes("ornek")) {
      return language === "en"
        ? 'Here\'s a good goal example:\n\n"Create a responsive sign-in form component with email and password fields, client-side validation, error messages for invalid inputs, a loading state during submission, and a \'forgot password\' link."\n\nNotice how it lists specific features the AI should include.'
        : 'Iste iyi bir hedef ornegi:\n\n"E-posta ve sifre alanlari, istemci tarafi dogrulama, gecersiz girdiler icin hata mesajlari, gonderim sirasinda yukleniyor durumu ve \'sifre unuttum\' baglantisi olan duyarli bir giris formu bileseni olusturun."\n\nAI\'nin dahil etmesi gereken belirli ozellikleri nasil listeledigine dikkat edin.';
    }
    if (q.includes("start") || q.includes("basla") || q.includes("help")) {
      return language === "en"
        ? "Start by answering: What exactly do you want the AI to build?\n\nThink about:\n- What type of component (form, page, modal)?\n- What fields does it need (email, password, remember me)?\n- What behaviors (validation, error handling, loading states)?\n\nWrite it as a clear instruction: \"Create a [type] with [features].\""
        : "Soyle baslyin: AI'nin tam olarak ne olusturmasini istiyorsunuz?\n\nDusunun:\n- Ne tur bir bilesen (form, sayfa, modal)?\n- Hangi alanlar gerekiyor (e-posta, sifre, beni hatirlat)?\n- Hangi davranislar (dogrulama, hata isleme, yukleniyor durumlari)?\n\nAcik bir talimat olarak yazin: \"[ozelliklerle] bir [tur] olusturun.\"";
    }
    if (q.includes("clear") || q.includes("good") || q.includes("iyi")) {
      return language === "en"
        ? "A good prompt goal is:\n\n1. **Specific** - Not \"make a login\" but \"create a sign-in form with email/password\"\n2. **Measurable** - List concrete features: validation, error handling, loading state\n3. **Scoped** - Define boundaries: just the form? The whole page? The API call too?\n\nThe more specific your goal, the better the AI output!"
        : "Iyi bir prompt hedefi:\n\n1. **Spesifik** - \"Bir giris yap\" degil, \"e-posta/sifreli bir giris formu olustur\"\n2. **Olculebilir** - Somut ozellikler listeleyin: dogrulama, hata isleme\n3. **Kapsamli** - Sinirlari tanimlayin: sadece form mu? Tum sayfa mi?\n\nHedef ne kadar spesifikse, AI ciktisi o kadar iyi!";
    }
  }

  // Step 2 - Role
  if (stepId === 2) {
    if (q.includes("example") || q.includes("ornek")) {
      return language === "en"
        ? 'Good role examples:\n\n- "You are a senior frontend developer with 10 years of experience in React and authentication systems."\n- "Act as a security-focused full-stack engineer who specializes in building secure auth flows."\n- "You are a UI/UX developer who writes clean, accessible, and well-tested React components."\n\nPick one that matches what you need!'
        : 'Iyi rol ornekleri:\n\n- "React ve kimlik dogrulama sistemlerinde 10 yillik deneyime sahip kidemli bir frontend gelistiricisiniz."\n- "Guvenli auth akislari olusturmada uzmanlasmsguvenlik odakli bir full-stack muhendis olarak hareket edin."\n- "Temiz, erisilebilir ve iyi test edilmis React bilesenleri yazan bir UI/UX gelistiricisiniz."';
    }
    if (q.includes("why") || q.includes("neden")) {
      return language === "en"
        ? "Setting a role helps because:\n\n1. **Focuses expertise** - The AI adopts domain-specific knowledge\n2. **Sets quality bar** - \"Senior developer\" means production-ready code\n3. **Shapes style** - A \"security specialist\" will prioritize input sanitization\n\nWithout a role, the AI gives generic answers. With one, it gives expert-level output."
        : "Rol belirleme yardimci olur cunku:\n\n1. **Uzmanlik odaklar** - AI alana ozgu bilgi benimser\n2. **Kalite barini ayarlar** - \"Kidemli gelistirici\" uretime hazir kod demektir\n3. **Stili sekillendrir** - \"Guvenlik uzmani\" girdi dogrulamayi onceliklendirir";
    }
  }

  // Step 3 - Context
  if (stepId === 3) {
    if (q.includes("tech") || q.includes("stack") || q.includes("teknoloji")) {
      return language === "en"
        ? "For an auth sign-in, consider specifying:\n\n- **Framework**: React, Next.js, Vue\n- **Language**: TypeScript (recommended for types)\n- **Styling**: Tailwind CSS, CSS Modules, shadcn/ui\n- **Validation**: Zod, Yup, React Hook Form\n- **State**: useState, Redux, Zustand\n- **Design**: Dark mode support, responsive, mobile-first\n\nExample: \"Use React with TypeScript, Tailwind CSS for styling, Zod for validation, and shadcn/ui components.\""
        : "Auth giris icin belirtmeyi dusunun:\n\n- **Framework**: React, Next.js, Vue\n- **Dil**: TypeScript (tipler icin onerilen)\n- **Stillendirme**: Tailwind CSS, CSS Modules, shadcn/ui\n- **Dogrulama**: Zod, Yup, React Hook Form\n- **Durum**: useState, Redux, Zustand";
    }
  }

  // Step 4 - I/O
  if (stepId === 4) {
    if (q.includes("example") || q.includes("ornek") || q.includes("format")) {
      return language === "en"
        ? "Good I/O definition example:\n\n**Input (Props):**\n- `onSubmit: (email: string, password: string) => Promise<void>`\n- `onForgotPassword?: () => void`\n- `redirectUrl?: string`\n\n**Output:**\n- Single `.tsx` file with the component\n- TypeScript interface for props\n- Internal validation logic\n- No external API calls - just the form UI"
        : "Iyi G/C tanimi ornegi:\n\n**Girdi (Props):**\n- `onSubmit: (email: string, password: string) => Promise<void>`\n- `onForgotPassword?: () => void`\n\n**Cikti:**\n- Bileseni iceren tek `.tsx` dosyasi\n- Props icin TypeScript arayuzu\n- Dahili dogrulama mantigi";
    }
  }

  // Step 5 - Examples
  if (stepId === 5) {
    if (q.includes("how many") || q.includes("kac")) {
      return language === "en"
        ? "For prompt engineering, 1-3 examples is usually enough:\n\n1. **Happy path** - User enters valid credentials, sees loading, gets redirected\n2. **Error case** - Invalid email format, wrong password, network error\n3. **Edge case** - Empty fields, very long inputs, special characters\n\nEven one good example dramatically improves output quality!"
        : "Prompt muhendisligi icin genellikle 1-3 ornek yeterlidir:\n\n1. **Mutlu yol** - Kullanici gecerli kimlik bilgileri girer, yuklenmeyi gorur, yonlendirilir\n2. **Hata durumu** - Gecersiz e-posta, yanlis sifre\n3. **Uc durum** - Bos alanlar, cok uzun girdiler";
    }
  }

  // Step 6 - Test & Refine
  if (stepId === 6) {
    if (q.includes("review") || q.includes("missing") || q.includes("incele") || q.includes("eksik")) {
      return language === "en"
        ? "Checklist for a complete prompt:\n\n- [ ] Clear goal: What should be built?\n- [ ] Role defined: Who is the AI acting as?\n- [ ] Tech stack specified: Framework, language, styling\n- [ ] Input/output clear: Props, return format, file structure\n- [ ] Examples included: At least one happy path + one error case\n- [ ] Constraints: What NOT to do, accessibility, performance\n\nIf you covered all these, your prompt is strong!"
        : "Tam bir prompt icin kontrol listesi:\n\n- [ ] Net hedef: Ne olusturulmali?\n- [ ] Rol tanimli: AI kim olarak hareket ediyor?\n- [ ] Teknoloji yigini belirtilmis: Framework, dil, stillendirme\n- [ ] Girdi/cikti net: Props, donus formati, dosya yapisi\n- [ ] Ornekler dahil: En az bir mutlu yol + bir hata durumu\n- [ ] Kisitlamalar: Ne YAPILMAMALI, erisilebilirlik, performans";
    }
  }

  // Check if question is about general development (not prompt engineering)
  const isGeneralDevQuestion =
    q.includes("build") ||
    q.includes("create") ||
    q.includes("component") ||
    q.includes("api") ||
    q.includes("database") ||
    q.includes("function") ||
    q.includes("solve") ||
    q.includes("problem") ||
    q.includes("error") ||
    q.includes("bug") ||
    q.includes("implement") ||
    q.includes("code") ||
    q.includes("olustur") ||
    q.includes("yap") ||
    q.includes("cozum") ||
    q.includes("hata") ||
    q.includes("kod");

  // General development question - encourage using AI model
  if (isGeneralDevQuestion && !q.includes("prompt")) {
    return language === "en"
      ? `I can help you with that! For detailed assistance with development questions, code examples, and solutions, please load the AI model using the "Download & Start" button above.\n\nThe AI assistant can help with:\n- Building components and features\n- Solving coding problems\n- Architecture and best practices\n- Debugging and error fixing\n- And much more!\n\nFor now, here's a quick tip: Be specific about what you're trying to build or solve, include your tech stack (React, TypeScript, etc.), and describe any errors or constraints you're facing.`
      : `Buna yardimci olabilirim! Gelistirme sorulari, kod ornekleri ve cozumler icin detayli yardim almak icin lutfen yukaridaki "Indir ve Baslat" butonunu kullanarak AI modelini yukleyin.\n\nAI asistan su konularda yardimci olabilir:\n- Bilesen ve ozellik olusturma\n- Kod problemlerini cozme\n- Mimari ve en iyi uygulamalar\n- Hata ayiklama\n- Ve daha fazlasi!\n\nSimdilik hizli bir ipucu: Ne olusturmaya veya cozmeye calistiginizi spesifik olun, teknoloji yigininizi (React, TypeScript, vb.) belirtin ve karsilastiginiz hatalari veya kisitlamalari tanimlayin.`;
  }

  // General fallback for prompt engineering questions
  if (q.includes("prompt") || q.includes("how") || q.includes("what") || q.includes("nasil") || q.includes("ne")) {
    const tipIndex = Math.floor(Math.random() * GENERAL_TIPS[language].length);
    const tip = GENERAL_TIPS[language][tipIndex];
    return language === "en"
      ? `Here's a prompt engineering tip:\n\n${tip}\n\nFor more detailed help with prompt engineering or any development question, load the AI model above for comprehensive assistance!`
      : `Iste bir prompt muhendisligi ipucu:\n\n${tip}\n\nPrompt muhendisligi veya herhangi bir gelistirme sorusu icin daha detayli yardim almak icin yukaridaki AI modelini yukleyin!`;
  }

  // Default - encourage AI model for better help
  return language === "en"
    ? `Great question! For Step ${stepId}, focus on: ${stepId === 1 ? "writing a clear, specific goal" : stepId === 2 ? "assigning an expert role to the AI" : stepId === 3 ? "specifying your tech stack and constraints" : stepId === 4 ? "defining what the component receives and returns" : stepId === 5 ? "providing concrete examples" : "combining everything into one cohesive prompt"}.\n\nFor detailed help with this step or any development question, load the AI model above!`
    : `Iyi soru! Adim ${stepId} icin su konuya odaklanin: ${stepId === 1 ? "net, spesifik bir hedef yazma" : stepId === 2 ? "AI'ye uzman bir rol atama" : stepId === 3 ? "teknoloji yigini ve kisitlamalari belirtme" : stepId === 4 ? "bilesenin neler alip dondurecegini tanimlama" : stepId === 5 ? "somut ornekler saglama" : "her seyi tek bir tutarli promptta birlestirme"}.\n\nBu adim veya herhangi bir gelistirme sorusu icin detayli yardim almak icin yukaridaki AI modelini yukleyin!`;
}

export function AssistantChat({
  simulationTitle,
  currentStep,
  userPromptDraft,
  language,
}: AssistantChatProps) {
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check WebGPU support on mount
  useEffect(() => {
    const supported = isWebGPUSupported();
    setWebGPUAvailable(supported);
    if (!supported) {
      setUseBuiltIn(true);
    }
    isModelCached().then(setCached);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Get welcome message helper
  const getWelcomeMessage = useCallback(() => {
    const stepTitle =
      language === "en" ? currentStep.titleEn : currentStep.titleTr;
    return language === "en"
      ? `You're on **Step ${currentStep.id}: ${stepTitle}**. I can help you with:\n\n• This simulation step\n• Prompt engineering questions\n• **ANY development question** - React, APIs, databases, debugging, algorithms, etc.\n\nTap a suggestion below or ask me anything!`
      : `**Adim ${currentStep.id}: ${stepTitle}** uzerindesiniz. Size yardimci olabilirim:\n\n• Bu simulasyon adimi\n• Prompt muhendisligi sorulari\n• **HERHANGI bir gelistirme sorusu** - React, API'ler, veritabanlari, hata ayiklama, algoritmalar, vb.\n\nAsagidaki bir oneriyi tiklayin veya bana herhangi bir sey sorun!`;
  }, [currentStep, language]);

  // Add welcome message when step changes
  useEffect(() => {
    setMessages([{ role: "assistant", content: getWelcomeMessage() }]);
  }, [currentStep, language, getWelcomeMessage]);

  // Reset chat function
  const handleResetChat = useCallback(() => {
    setMessages([{ role: "assistant", content: getWelcomeMessage() }]);
    setInputValue("");
  }, [getWelcomeMessage]);

  // Initialize engine
  const handleInitEngine = useCallback(async () => {
    if (engine || isLoading) return;
    setIsLoading(true);
    setInitError(null);

    try {
      const e = await initEngine((progress) => {
        setLoadProgress(progress);
      });
      setEngine(e);
      setUseBuiltIn(false);
    } catch (err) {
      console.error("Failed to init engine:", err);
      setInitError(
        err instanceof Error ? err.message : "Failed to load AI model"
      );
      // Fall back to built-in mode
      setUseBuiltIn(true);
    } finally {
      setIsLoading(false);
      setLoadProgress(null);
    }
  }, [engine, isLoading]);

  // Start with built-in helper (no model needed)
  const handleStartBuiltIn = useCallback(() => {
    setUseBuiltIn(true);
  }, []);

  // Handle suggestion chip click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInputValue(suggestion);
      // Auto-send the suggestion
      setTimeout(() => {
        const fakeInput = suggestion;
        if (!fakeInput.trim()) return;

        const userMsg: ChatMessage = { role: "user", content: fakeInput };

        if (engine && !isStreaming) {
          // Use LLM
          setMessages((prev) => [...prev, userMsg]);
          setIsStreaming(true);
          setInputValue("");

          const assistantMsg: ChatMessage = { role: "assistant", content: "" };
          setMessages((prev) => [...prev, assistantMsg]);

          const stepTitle =
            language === "en" ? currentStep.titleEn : currentStep.titleTr;
          const stepDesc =
            language === "en"
              ? currentStep.descriptionEn
              : currentStep.descriptionTr;

          const systemPrompt = buildSystemPrompt(
            simulationTitle,
            currentStep.id,
            stepTitle,
            stepDesc,
            userPromptDraft
          );

          streamChat(
            engine,
            systemPrompt,
            [userMsg],
            (_token, fullText) => {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: fullText,
                };
                return updated;
              });
            }
          )
            .catch(() => {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content:
                    language === "en"
                      ? "Sorry, something went wrong. Please try again."
                      : "Uzgunum, bir sorun olustu. Lutfen tekrar deneyin.",
                };
                return updated;
              });
            })
            .finally(() => setIsStreaming(false));
        } else {
          // Use built-in responses
          setMessages((prev) => [...prev, userMsg]);
          setInputValue("");
          const response = getBuiltInResponse(
            currentStep.id,
            fakeInput,
            language
          );
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: response },
            ]);
          }, 300);
        }
      }, 50);
    },
    [engine, isStreaming, currentStep, language, simulationTitle, userPromptDraft]
  );

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

      const stepTitle =
        language === "en" ? currentStep.titleEn : currentStep.titleTr;
      const stepDesc =
        language === "en"
          ? currentStep.descriptionEn
          : currentStep.descriptionTr;

      const systemPrompt = buildSystemPrompt(
        simulationTitle,
        currentStep.id,
        stepTitle,
        stepDesc,
        userPromptDraft
      );

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
      // Use built-in responses
      const response = getBuiltInResponse(currentStep.id, text, language);
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

  const suggestions = STEP_SUGGESTIONS[currentStep.id]?.[language] || [];

  // ─── Engine not loaded: show choice (Download AI Model OR Use Built-in Helper) ───
  if (!engine && !isLoading && !useBuiltIn) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center gap-3">
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
                ? "Download a small AI model (~360MB) for smart AI help, or start with built-in guidance."
                : "Akilli AI yardimi icin kucuk bir model (~360MB) indirin veya dahili rehberlikle baslayin."}
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
              ? "WebGPU not available in your browser"
              : "WebGPU tarayicinizda mevcut degil"}
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
    );
  }

  // ─── Loading state ───
  if (isLoading && loadProgress) {
    const progressPercent = Math.round(loadProgress.progress * 100);
    const isDownloading = loadProgress.stage === "downloading";

    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="w-full max-w-sm space-y-3">
          {/* Progress Text */}
          <div>
            <p className="text-sm font-medium mb-1">{loadProgress.text}</p>
            {loadProgress.fileSize && (
              <p className="text-xs text-muted-foreground">
                {loadProgress.fileSize}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isDownloading ? "bg-primary" : "bg-green-500"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {progressPercent}%
              </span>
              {isDownloading && progressPercent > 0 && progressPercent < 100 && (
                <span className="text-muted-foreground">
                  {language === "en" ? "Downloading..." : "Indiriliyor..."}
                </span>
              )}
              {progressPercent === 100 && (
                <span className="text-green-600 dark:text-green-400">
                  {language === "en" ? "Complete!" : "Tamamlandi!"}
                </span>
              )}
            </div>
          </div>

          {/* Additional Info */}
          {isDownloading && progressPercent > 0 && progressPercent < 100 && (
            <div className="space-y-1">
              {loadProgress.estimatedTimeRemaining && (
                <p className="text-xs font-medium text-primary">
                  {loadProgress.estimatedTimeRemaining}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {language === "en"
                  ? "Please keep this tab open. The model will be cached for future use."
                  : "Lutfen bu sekmeyi acik tutun. Model gelecekte kullanilmak uzere onbellege alinacak."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Chat UI (works with both LLM and built-in) ───
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/20">
        {engine ? (
          <div className="h-2 w-2 rounded-full bg-green-500" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-amber-500" />
        )}
        <span className="text-xs font-medium">
          {language === "en" ? "AI Assistant" : "AI Asistan"}
        </span>
        <Badge variant="outline" className="text-[10px] h-4 px-1">
          {engine ? "SmolLM2" : language === "en" ? "Built-in" : "Dahili"}
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          {/* Reset Chat Button */}
          {messages.length > 1 && (
            <button
              onClick={handleResetChat}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              title={language === "en" ? "Reset chat" : "Sohbeti sifirla"}
            >
              <RotateCcw className="h-3 w-3" />
              <span>{language === "en" ? "Reset" : "Sifirla"}</span>
            </button>
          )}
          {!engine && webGPUAvailable && (
            <button
              onClick={handleInitEngine}
              className="text-[10px] text-primary hover:underline"
            >
              {language === "en" ? "Upgrade to AI" : "AI'ye yukselt"}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
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

        {/* Suggestion Chips - shown after welcome or when not streaming */}
        {!isStreaming && messages.length <= 2 && suggestions.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Zap className="h-3 w-3" />
              {language === "en" ? "Quick questions:" : "Hizli sorular:"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs",
                    "border border-border bg-background hover:bg-muted hover:border-primary/30",
                    "transition-colors cursor-pointer text-left"
                  )}
                >
                  {i === 0 ? (
                    <Lightbulb className="h-3 w-3 text-amber-500 flex-shrink-0" />
                  ) : i === suggestions.length - 1 ? (
                    <HelpCircle className="h-3 w-3 text-primary flex-shrink-0" />
                  ) : null}
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-2">
        <div className="flex gap-1.5">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === "en"
                ? "Ask me anything - prompts, code, debugging, APIs..."
                : "Bana herhangi bir sey sorun - promptlar, kod, hata ayiklama, API'ler..."
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
    </div>
  );
}
