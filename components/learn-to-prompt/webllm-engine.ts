// WebLLM engine singleton and helpers
// Uses @mlc-ai/web-llm for in-browser LLM inference via WebGPU
// Model weights are cached in IndexedDB after first download

import type { MLCEngine, ChatCompletionMessageParam } from "@mlc-ai/web-llm";

const MODEL_ID = "SmolLM2-360M-Instruct-q4f32_1-MLC";

let engineInstance: MLCEngine | null = null;
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
export async function isModelCached(): Promise<boolean> {
  try {
    const { hasModelInCache } = await import("@mlc-ai/web-llm");
    return await hasModelInCache(MODEL_ID);
  } catch {
    return false;
  }
}

// Initialize the WebLLM engine (singleton)
export async function initEngine(
  onProgress: (progress: LoadProgress) => void
): Promise<MLCEngine> {
  // Return existing instance if ready
  if (engineInstance) return engineInstance;

  // Prevent double initialization
  if (engineLoading) {
    // Wait for existing load to finish
    while (engineLoading) {
      await new Promise((r) => setTimeout(r, 200));
    }
    if (engineInstance) return engineInstance;
  }

  engineLoading = true;

  try {
    const { CreateMLCEngine, hasModelInCache } = await import(
      "@mlc-ai/web-llm"
    );

    const cached = await hasModelInCache(MODEL_ID);
    
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
        text: "Preparing to download model (~360MB)...",
        progress: 0,
        stage: "downloading",
      });
    }

    const engine = await CreateMLCEngine(MODEL_ID, {
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
          const totalSize = 360; // ~360MB
          const downloaded = Math.round(totalSize * progress);
          fileSize = `${downloaded}MB / ${totalSize}MB`;
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
    max_tokens: 256,
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
  return `You are a friendly and knowledgeable prompt engineering tutor helping a developer learn to build effective AI prompts.

You can answer ANY question about prompt engineering, including:
- How to write better prompts for any use case
- Best practices for structuring prompts
- Tips for getting better results from AI models
- General software development prompting techniques
- Specific guidance for the current simulation step

Keep answers concise (3-5 sentences). Use examples when helpful. Be encouraging.

CURRENT CONTEXT:
Simulation: ${simulationTitle}
Current step: Step ${stepNumber}/6 - ${stepTitle}
Step goal: ${stepDescription}

${userPromptDraft ? `The student's current prompt draft for this step:\n---\n${userPromptDraft}\n---\n` : "The student has not written anything for this step yet."}

When the student asks about the current step, give specific actionable advice.
When they ask a general prompt engineering question, answer it fully, then briefly connect it back to their current step if relevant.
If they share their prompt draft, give constructive feedback on how to improve it.
If they seem stuck, offer a concrete example or starting template.`;
}
