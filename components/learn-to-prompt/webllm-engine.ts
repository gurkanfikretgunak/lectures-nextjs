// WebLLM engine singleton and helpers
// Uses @mlc-ai/web-llm for in-browser LLM inference via WebGPU
// Model weights are cached in IndexedDB after first download

import type { MLCEngine, ChatCompletionMessageParam } from "@mlc-ai/web-llm";

// Available models
export const AVAILABLE_MODELS = {
  smol: {
    id: "SmolLM2-360M-Instruct-q4f32_1-MLC",
    name: "SmolLM2-360M",
    size: "~360MB",
    sizeMB: 360,
    description: {
      en: "Small & Fast - Quick responses, lower memory usage",
      tr: "Kucuk & Hizli - Hizli yanitlar, dusuk bellek kullanimi",
    },
    capabilities: {
      en: [
        "Fast response times",
        "Lower memory footprint",
        "Good for simple questions",
        "Quick code snippets",
      ],
      tr: [
        "Hizli yanit sureleri",
        "Dusuk bellek kullanimi",
        "Basit sorular icin ideal",
        "Hizli kod parcalari",
      ],
    },
  },
  llama: {
    id: "Llama-3.2-1B-Instruct-q0f16-MLC",
    name: "Llama-3.2-1B",
    size: "~1.5GB",
    sizeMB: 1500,
    description: {
      en: "Larger & Smarter - Better understanding, more capable",
      tr: "Buyuk & Akilli - Daha iyi anlama, daha yetenekli",
    },
    capabilities: {
      en: [
        "Better understanding",
        "More detailed responses",
        "Complex problem solving",
        "Advanced code generation",
      ],
      tr: [
        "Daha iyi anlama",
        "Daha detayli yanitlar",
        "Karmasik problem cozme",
        "Gelismis kod uretimi",
      ],
    },
  },
} as const;

export type ModelKey = keyof typeof AVAILABLE_MODELS;

const DEFAULT_MODEL: ModelKey = "llama";

let engineInstance: MLCEngine | null = null;
let currentModelId: string | null = null;
let engineLoading = false;
let downloadStartTime: number | null = null;
let lastProgress: number = 0;
let lastProgressTime: number | null = null;

export interface LoadProgress {
  text: string;
  progress: number;
  stage?: string; // e.g., "downloading", "loading", "initializing"
  fileSize?: string; // e.g., "150MB / 360MB"
  estimatedTimeRemaining?: string; // e.g., "~2 minutes remaining"
}

// Check if WebGPU is available in the browser
export function isWebGPUSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return "gpu" in navigator;
}

// Check if model is already cached in IndexedDB
export async function isModelCached(modelId: string): Promise<boolean> {
  try {
    const { hasModelInCache } = await import("@mlc-ai/web-llm");
    return await hasModelInCache(modelId);
  } catch {
    return false;
  }
}

// Reset engine instance (for model switching)
export function resetEngine(): void {
  engineInstance = null;
  currentModelId = null;
  engineLoading = false;
}

// Initialize the WebLLM engine (singleton)
export async function initEngine(
  onProgress: (progress: LoadProgress) => void,
  modelKey: ModelKey = DEFAULT_MODEL
): Promise<MLCEngine> {
  const modelId = AVAILABLE_MODELS[modelKey].id;
  const modelInfo = AVAILABLE_MODELS[modelKey];

  // Return existing instance if it's the same model
  if (engineInstance && currentModelId === modelId) {
    return engineInstance;
  }

  // If different model, reset first
  if (engineInstance && currentModelId !== modelId) {
    engineInstance = null;
    currentModelId = null;
  }

  // Prevent double initialization
  if (engineLoading) {
    // Wait for existing load to finish
    while (engineLoading) {
      await new Promise((r) => setTimeout(r, 200));
    }
    if (engineInstance && currentModelId === modelId) return engineInstance;
  }

  engineLoading = true;
  currentModelId = modelId;

  try {
    const { CreateMLCEngine, hasModelInCache } = await import(
      "@mlc-ai/web-llm"
    );

    const cached = await hasModelInCache(modelId);
    
    // Reset download tracking
    downloadStartTime = null;
    lastProgress = 0;
    lastProgressTime = null;

    if (cached) {
      onProgress({
        text: "Loading model from cache...",
        progress: 0.8,
        stage: "loading",
      });
    } else {
      downloadStartTime = Date.now();
      lastProgressTime = Date.now();
      onProgress({
        text: `Preparing to download model (${modelInfo.size})...`,
        progress: 0,
        stage: "downloading",
      });
    }

    const engine = await CreateMLCEngine(modelId, {
      initProgressCallback: (report) => {
        // Parse the progress text to extract more information
        const text = report.text || "";
        const progress = report.progress || 0;
        const now = Date.now();

        // Detect stage from text
        let stage: string | undefined;
        if (
          text.toLowerCase().includes("fetch") ||
          text.toLowerCase().includes("download") ||
          text.toLowerCase().includes("loading")
        ) {
          stage = "downloading";
        } else if (
          text.toLowerCase().includes("init") ||
          text.toLowerCase().includes("initialize")
        ) {
          stage = "initializing";
        } else if (
          text.toLowerCase().includes("cache") ||
          text.toLowerCase().includes("load")
        ) {
          stage = "loading";
        }

        // Try to extract file size information from text
        let fileSize: string | undefined;
        const sizeMatch = text.match(/(\d+(?:\.\d+)?)\s*(MB|KB|GB)/i);
        if (sizeMatch) {
          fileSize = sizeMatch[0];
        } else if (progress > 0 && progress < 1 && !cached) {
          // Estimate file size based on progress
          const totalSizeMB = modelInfo.sizeMB;
          const downloaded = Math.round(totalSizeMB * progress);
          // Show in GB if over 1000MB
          if (downloaded >= 1000) {
            const downloadedGB = (downloaded / 1000).toFixed(1);
            const totalGB = (totalSizeMB / 1000).toFixed(1);
            fileSize = `${downloadedGB}GB / ${totalGB}GB`;
          } else {
            fileSize = `${downloaded}MB / ${totalSizeMB}MB`;
          }
        }

        // Calculate estimated time remaining
        let estimatedTimeRemaining: string | undefined;
        if (!cached && progress > 0 && progress < 1 && downloadStartTime && lastProgressTime) {
          const progressDelta = progress - lastProgress;
          const timeDelta = (now - lastProgressTime) / 1000; // seconds

          if (progressDelta > 0 && timeDelta > 0) {
            const progressPerSecond = progressDelta / timeDelta;
            const remainingProgress = 1 - progress;
            const secondsRemaining = remainingProgress / progressPerSecond;

            if (secondsRemaining > 0 && secondsRemaining < 3600) {
              // Less than 1 hour
              const minutes = Math.ceil(secondsRemaining / 60);
              estimatedTimeRemaining = `~${minutes} ${minutes === 1 ? "minute" : "minutes"} remaining`;
            }
          }

          lastProgress = progress;
          lastProgressTime = now;
        }

        // Enhance progress text for better UX
        let enhancedText = text;
        if (text.toLowerCase().includes("start to fetch params")) {
          enhancedText = cached
            ? "Loading model parameters from cache..."
            : "Downloading model parameters (this may take a few minutes)...";
        } else if (text.toLowerCase().includes("fetch") && !text.toLowerCase().includes("complete")) {
          enhancedText = cached
            ? text
            : `Downloading: ${text} (${Math.round(progress * 100)}%)`;
        }

        onProgress({
          text: enhancedText,
          progress,
          stage,
          fileSize,
          estimatedTimeRemaining,
        });
      },
    });

    engineInstance = engine;
    onProgress({ text: "Model ready!", progress: 1 });
    return engine;
  } finally {
    engineLoading = false;
  }
}

// Get the current engine instance (may be null if not initialized)
export function getEngine(): MLCEngine | null {
  return engineInstance;
}

// Send a chat message with streaming
export async function streamChat(
  engine: MLCEngine,
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
  onToken: (token: string, fullText: string) => void
): Promise<string> {
  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const chunks = await engine.chat.completions.create({
    messages: chatMessages,
    temperature: 0.7,
    max_tokens: 1024, // Increased for comprehensive answers to complex development questions
    stream: true,
    stream_options: { include_usage: true },
  });

  let fullReply = "";
  for await (const chunk of chunks) {
    const delta = chunk.choices[0]?.delta?.content || "";
    fullReply += delta;
    onToken(delta, fullReply);
  }

  return fullReply;
}

// Build the system prompt with current simulation context
export function buildSystemPrompt(
  simulationTitle: string,
  stepNumber: number,
  stepTitle: string,
  stepDescription: string,
  userPromptDraft: string
): string {
  return `You are a helpful AI coding assistant. Your job is to help developers solve ANY programming, development, or technical problem they ask about.

**YOUR PRIMARY GOAL**: Answer the user's question directly and completely. Help them solve their problem, regardless of what it is.

**WHAT YOU CAN HELP WITH** (but not limited to):
- Any programming language (JavaScript, TypeScript, Python, Java, C++, Go, Rust, etc.)
- Web development (React, Vue, Angular, Next.js, HTML, CSS, etc.)
- Backend development (Node.js, Express, Django, Flask, APIs, databases, etc.)
- Mobile development (React Native, Flutter, Swift, Kotlin, etc.)
- DevOps, deployment, Docker, CI/CD
- Algorithms, data structures, system design
- Debugging, error fixing, troubleshooting
- Code review, best practices, architecture
- Prompt engineering and AI/LLM integration
- ANY other technical or development question

**CRITICAL RULES**:
1. Answer their question directly - don't redirect or suggest they ask something else
2. Provide complete, actionable solutions with code examples when relevant
3. If they ask about a different project/case than the simulation, help them with THEIR question
4. Be solution-oriented and practical
5. Keep answers concise but complete (3-8 sentences, more if needed for complex topics)

**SIMULATION CONTEXT** (only use if relevant to their question):
- Current simulation: ${simulationTitle}
- Current step: Step ${stepNumber}/6 - ${stepTitle}
${userPromptDraft ? `- Their prompt draft: ${userPromptDraft.substring(0, 200)}...\n` : ""}

**REMEMBER**: The user's question is what matters. Help them solve their problem, whatever it is!`;
}
