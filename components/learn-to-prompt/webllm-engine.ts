// WebLLM engine singleton and helpers
// Uses @mlc-ai/web-llm for in-browser LLM inference via WebGPU
// Model weights are cached in IndexedDB after first download

import type { MLCEngine, ChatCompletionMessageParam } from "@mlc-ai/web-llm";

const MODEL_ID = "SmolLM2-360M-Instruct-q4f32_1-MLC";

let engineInstance: MLCEngine | null = null;
let engineLoading = false;

export interface LoadProgress {
  text: string;
  progress: number;
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
    if (cached) {
      onProgress({ text: "Loading model from cache...", progress: 0.8 });
    } else {
      onProgress({ text: "Downloading model for the first time...", progress: 0 });
    }

    const engine = await CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (report) => {
        onProgress({
          text: report.text,
          progress: report.progress,
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
