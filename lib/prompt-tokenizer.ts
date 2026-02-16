// Tokenizer for Llama models - uses llama-tokenizer-js (Llama 1/2 compatible)
// Llama 3.2 uses similar BPE; ~5-10% variance vs exact Llama 3 tokenizer

export interface TokenInfo {
  index: number;
  tokenId: number;
  token: string;
}

export interface PromptAnatomySegment {
  type: "role" | "instruction" | "example" | "constraint" | "list" | "header" | "text";
  text: string;
  start: number;
  end: number;
}

export interface PromptMatrixScore {
  clarity: number;
  specificity: number;
  length: number;
  structure: number;
  completeness: number;
  overall: number;
}

export async function tokenizeForLlama(text: string): Promise<{ tokens: TokenInfo[]; totalTokens: number }> {
  try {
    const llamaTokenizer = (await import("llama-tokenizer-js")).default;
    // System prompts typically don't need BOS; add_preceding_space=false for raw count
    const ids = llamaTokenizer.encode(text, false, false);
    const vocabById = llamaTokenizer.vocabById as string[];
    const tokens: TokenInfo[] = ids.map((id, i) => {
      const t = vocabById[id] ?? `[${id}]`;
      return {
        index: i + 1,
        tokenId: id,
        token: t.replace(/[\x00-\x1f\x7f]/g, "�"),
      };
    });
    return { tokens, totalTokens: ids.length };
  } catch {
    const estTokens = Math.ceil(text.length / 4);
    const words = text.split(/\s+/).filter(Boolean);
    const tokens: TokenInfo[] = words.slice(0, 150).map((w, i) => ({
      index: i + 1,
      tokenId: i,
      token: w,
    }));
    if (words.length > 150) {
      tokens.push({ index: 151, tokenId: 150, token: `... (+${words.length - 150} more)` });
    }
    return { tokens, totalTokens: estTokens };
  }
}

// Parse prompt into colored segments for anatomy view
export function parsePromptAnatomy(text: string): PromptAnatomySegment[] {
  const segments: PromptAnatomySegment[] = [];
  const lines = text.split("\n");
  let offset = 0;

  for (const line of lines) {
    const start = offset;
    const end = offset + line.length + 1;
    const trimmed = line.trim();

    if (!trimmed) {
      segments.push({ type: "text", text: "\n", start, end });
      offset = end;
      continue;
    }

    let type: PromptAnatomySegment["type"] = "text";
    if (/^you are|^you're|^your role|^act as/i.test(trimmed)) type = "role";
    else if (/^\*\*[^*]+\*\*:/.test(trimmed) || /^[A-Z][^:]*:$/.test(trimmed)) type = "header";
    else if (/^[-*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) type = "list";
    else if (/^(always|never|must|should|do not|don't)\s/i.test(trimmed)) type = "constraint";
    else if (/^(e\.g\.|example|for example|such as):/i.test(trimmed)) type = "example";
    else if (/^(help|assist|provide|explain|answer|focus on)/i.test(trimmed)) type = "instruction";

    segments.push({ type, text: line, start, end });
    offset = end;
  }
  return segments;
}

// Score prompt on multiple dimensions (0-100 each)
export function scorePromptMatrix(text: string): PromptMatrixScore {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const lines = trimmed.split("\n").filter((l) => l.trim());

  // Clarity: has clear structure, not too vague
  const hasStructure = /[\n*\-]/.test(trimmed) || lines.length >= 3;
  const hasSpecificity = /\b(specific|clear|concrete|example|step)\b/i.test(trimmed) || words.length > 20;
  const clarity = Math.min(100, (hasStructure ? 40 : 20) + (hasSpecificity ? 40 : 20) + 20);

  // Specificity: concrete instructions vs generic
  const bulletCount = (trimmed.match(/^[-*]\s/gm) || []).length;
  const hasExamples = /example|e\.g\.|for instance/i.test(trimmed);
  const specificity = Math.min(100, bulletCount * 10 + (hasExamples ? 30 : 0) + (words.length > 50 ? 20 : 10));

  // Length: optimal range 50-500 words
  const lenScore = words.length < 20 ? 30 : words.length < 50 ? 60 : words.length < 300 ? 90 : words.length < 500 ? 80 : 70;
  const length = Math.min(100, lenScore);

  // Structure: headers, lists, formatting
  const hasHeaders = /\*\*[^*]+\*\*/.test(trimmed);
  const structure = Math.min(100, (hasHeaders ? 30 : 0) + (bulletCount > 0 ? 40 : 0) + (lines.length > 2 ? 30 : 0));

  // Completeness: role + instructions + constraints
  const hasRole = /you are|you're|act as|your role/i.test(trimmed);
  const hasInstructions = /help|assist|provide|explain|answer|do|focus/i.test(trimmed);
  const completeness = Math.min(100, (hasRole ? 30 : 0) + (hasInstructions ? 40 : 0) + (bulletCount > 0 || hasHeaders ? 30 : 0));

  const overall = Math.round((clarity + specificity + length + structure + completeness) / 5);
  return { clarity, specificity, length, structure, completeness, overall: Math.min(100, overall) };
}

export interface PromptSuggestion {
  id: string;
  missing: boolean;
  suggestion: string;
  explanation: string;
  /** Template to insert when user clicks "Apply" */
  insertTemplate: string;
}

export function getPromptSuggestions(text: string, lang: "en" | "tr" = "en"): PromptSuggestion[] {
  const suggestions: PromptSuggestion[] = [];

  const hasRole = /you are|you're|act as|your role/i.test(text);
  suggestions.push({
    id: "role",
    missing: !hasRole,
    suggestion: lang === "en" ? "Add a clear role/persona (e.g. \"You are a senior Python developer...\")" : "Net bir rol/persona ekleyin (orn. \"Senior Python gelistiricisisiniz...\")",
    explanation:
      lang === "en"
        ? "Defining the AI's role sets expectations and expertise. Models perform better when given a persona—they anchor responses to that perspective."
        : "AI'nin rolunu tanimlamak beklentileri ve uzmanligi belirler. Modeller bir persona verildiginde daha iyi performans gosterir.",
    insertTemplate: lang === "en" ? "You are a helpful expert assistant. " : "Yardimci bir uzman asistansiniz. ",
  });

  const hasExamples = /example|e\.g\.|for instance|such as:|input:|output:/i.test(text);
  suggestions.push({
    id: "examples",
    missing: !hasExamples,
    suggestion: lang === "en" ? "Add a few-shot example (input → output format)" : "Bir veya iki ornek ekleyin (girdi → cikti formati)",
    explanation:
      lang === "en"
        ? "Examples teach the model the exact format and style you want. One good example often beats many instructions."
        : "Ornekler modele istediginiz tam formati ve stili ogretir. Iyi bir ornek cogu talimattan daha etkilidir.",
    insertTemplate:
      lang === "en"
        ? "\n\n**Example:**\nInput: [user question]\nOutput: [desired response format]"
        : "\n\n**Ornek:**\nGirdi: [kullanici sorusu]\nCikti: [istenen yanit formati]",
  });

  const hasConstraints = /(never|don't|do not|avoid|must not|always|should|must)\s/i.test(text);
  suggestions.push({
    id: "constraints",
    missing: !hasConstraints,
    suggestion: lang === "en" ? "Add constraints (what to avoid, what to always do)" : "Kisitlamalar ekleyin (nelerden kacinacak, her zaman yapilacaklar)",
    explanation:
      lang === "en"
        ? "Constraints reduce unwanted outputs. Explicit \"never\" and \"always\" rules help the model stay within boundaries."
        : "Kisitlamalar istenmeyen ciktilari azaltir. Acik \"asla\" ve \"her zaman\" kurallari modelin sinirlar icinde kalmasina yardim eder.",
    insertTemplate:
      lang === "en"
        ? "\n\n**Constraints:**\n- Always be accurate and helpful.\n- Never make up information."
        : "\n\n**Kisitlamalar:**\n- Her zaman dogru ve yardimci olun.\n- Asla bilgi uydurmayin.",
  });

  const hasOutputFormat = /(format|output|response|json|markdown|bullet|list|paragraph)/i.test(text);
  suggestions.push({
    id: "output-format",
    missing: !hasOutputFormat,
    suggestion: lang === "en" ? "Specify output format (JSON, bullets, markdown, length)" : "Cikti formatini belirtin (JSON, madde, markdown, uzunluk)",
    explanation:
      lang === "en"
        ? "Output format instructions reduce parsing errors. Specify structure (JSON vs prose), length (3-5 sentences), and style."
        : "Cikti format talimatlari ayrisma hatalarini azaltir. Yapi (JSON vs duz metin), uzunluk (3-5 cumle) ve stili belirtin.",
    insertTemplate:
      lang === "en"
        ? "\n\n**Output format:** Respond in 3-5 bullet points. Use code blocks for snippets."
        : "\n\n**Cikti formati:** 3-5 madde ile cevap verin. Kod icin code block kullanin.",
  });

  const hasScope = /(scope|context|when|if|topic|focus on|regarding)/i.test(text);
  suggestions.push({
    id: "scope",
    missing: !hasScope,
    suggestion: lang === "en" ? "Define scope/context (when to help, what topics)" : "Kapsam/baglami tanimlayin (ne zaman yardim, hangi konular)",
    explanation:
      lang === "en"
        ? "Scope prevents scope creep. Define what's in-bounds and when to redirect. Helps avoid off-topic or overreaching responses."
        : "Kapsam kapsam genislemesini onler. Neyin dahil oldugunu ve ne zaman yonlendirilecegini tanimlayin.",
    insertTemplate:
      lang === "en"
        ? "\n\n**Scope:** Focus on coding and development questions. When outside scope, say so politely."
        : "\n\n**Kapsam:** Kodlama ve gelistirme sorularina odaklanin. Kapsam disinda kalindiginda kibarca belirtin.",
  });

  const hasTone = /(friendly|concise|professional|formal|casual|brief|detailed)/i.test(text);
  suggestions.push({
    id: "tone",
    missing: !hasTone,
    suggestion: lang === "en" ? "Add tone/style (concise, friendly, professional)" : "Ton/stil ekleyin (oz, dostca, profesyonel)",
    explanation:
      lang === "en"
        ? "Tone guides response style. \"Concise\" vs \"detailed\" changes behavior. Match tone to your use case."
        : "Ton yanit stilini yonlendirir. \"Oz\" vs \"detayli\" davranisi degistirir.",
    insertTemplate: lang === "en" ? "\n\n**Tone:** Be concise, friendly, and practical." : "\n\n**Ton:** Oz, dostca ve pratik olun.",
  });

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const needsLength = wordCount < 30 || wordCount > 400;
  suggestions.push({
    id: "length",
    missing: needsLength,
    suggestion:
      lang === "en"
        ? wordCount < 30
          ? "Expand the prompt—add more detail (aim for 50–300 words)"
          : "Consider trimming—very long prompts can dilute key instructions"
        : wordCount < 30
          ? "Promptu genisletin—daha fazla detay ekleyin (50–300 kelime hedefleyin)"
          : "Kisaltmayi dusunun—cok uzun promptlar ana talimatlari sulandirabilir",
    explanation:
      lang === "en"
        ? "Optimal length: 50–300 words. Too short = vague. Too long = key instructions get lost in noise."
        : "Optimal uzunluk: 50–300 kelime. Cok kisa = belirsiz. Cok uzun = ana talimatlar gurultude kaybolur.",
    insertTemplate:
      wordCount < 30
        ? lang === "en"
          ? "\n\nAdd more specific instructions, examples, or constraints above."
          : "\n\nYukarida daha fazla ozel talimat, ornek veya kisitlama ekleyin."
        : lang === "en"
          ? "\n\nConsider removing redundant parts. Keep only the most important instructions."
          : "\n\nTekrarlayan kisimlari kaldirmayi dusunun. Sadece en onemli talimatlari tutun.",
  });

  return suggestions;
}
