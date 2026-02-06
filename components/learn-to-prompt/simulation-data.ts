// Simulation step definitions for the "Auth Sign-In" prompt engineering exercise

export interface ScoringCriteria {
  minWordCount: number;
  keywords: string[];
  minKeywordMatches: number;
}

export interface SimulationStep {
  id: number;
  titleEn: string;
  titleTr: string;
  descriptionEn: string;
  descriptionTr: string;
  hintEn: string;
  hintTr: string;
  placeholderEn: string;
  placeholderTr: string;
  scoring: ScoringCriteria;
}

export interface Simulation {
  id: string;
  titleEn: string;
  titleTr: string;
  descriptionEn: string;
  descriptionTr: string;
  steps: SimulationStep[];
}

export const AUTH_SIGNIN_SIMULATION: Simulation = {
  id: "auth-signin",
  titleEn: "Auth Sign-In Prompt Engineering",
  titleTr: "Kimlik Dogrulama Giris Prompt Muhendisligi",
  descriptionEn:
    "Learn to build an effective prompt that generates a complete authentication sign-in component.",
  descriptionTr:
    "Tam bir kimlik dogrulama giris bileseni olusturan etkili bir prompt olusturmayi ogrenin.",
  steps: [
    {
      id: 1,
      titleEn: "Define the Goal",
      titleTr: "Hedefi Tanimla",
      descriptionEn:
        "Write a clear statement of what the AI should accomplish. What kind of auth sign-in component do you need?",
      descriptionTr:
        "AI'nin ne yapmasi gerektigini acikca belirtin. Ne tur bir kimlik dogrulama giris bileseni gerekiyor?",
      hintEn:
        'Be specific about what you want: a sign-in form, page, or full auth flow. Example: "Create a sign-in form with email and password fields, validation, and error handling."',
      hintTr:
        'Ne istediginiz konusunda spesifik olun: bir giris formu, sayfasi veya tam auth akisi. Ornek: "E-posta ve sifre alanlari, dogrulama ve hata islemeli bir giris formu olusturun."',
      placeholderEn:
        "Describe the goal of your prompt... e.g., Create a sign-in form component with...",
      placeholderTr:
        "Promptunuzun hedefini tanimlayin... ornegin, ... ile bir giris formu bileseni olusturun",
      scoring: {
        minWordCount: 10,
        keywords: [
          "sign-in",
          "login",
          "auth",
          "form",
          "component",
          "email",
          "password",
          "create",
          "build",
          "generate",
        ],
        minKeywordMatches: 3,
      },
    },
    {
      id: 2,
      titleEn: "Set the Role",
      titleTr: "Rolu Belirle",
      descriptionEn:
        "Assign an expert role to the AI. What kind of developer should it act as?",
      descriptionTr:
        "AI'ye uzman bir rol atayin. Ne tur bir gelistirici olarak hareket etmeli?",
      hintEn:
        'Roles help the AI produce more focused and expert-level output. Example: "You are a senior frontend developer specializing in React and authentication systems."',
      hintTr:
        'Roller AI\'nin daha odakli ve uzman seviyesinde cikti uretmesine yardimci olur. Ornek: "React ve kimlik dogrulama sistemlerinde uzmanlasmi kdemli bir frontend gelistiricisiniz."',
      placeholderEn:
        "Define the role... e.g., You are a senior frontend developer who specializes in...",
      placeholderTr:
        "Rolu tanimlayin... ornegin, ... konusunda uzmanlasmi kdemli bir frontend gelistiricisiniz",
      scoring: {
        minWordCount: 8,
        keywords: [
          "you are",
          "role",
          "developer",
          "senior",
          "expert",
          "frontend",
          "engineer",
          "specialist",
          "experience",
          "react",
        ],
        minKeywordMatches: 2,
      },
    },
    {
      id: 3,
      titleEn: "Add Context",
      titleTr: "Baglam Ekle",
      descriptionEn:
        "Specify the tech stack, design constraints, and any specific requirements for the sign-in component.",
      descriptionTr:
        "Teknoloji yigini, tasarim kisitlamalari ve giris bileseni icin ozel gereksinimleri belirtin.",
      hintEn:
        "Include: framework (React/Next.js), styling (Tailwind/CSS), language (TypeScript), any libraries (shadcn, Zod), and design preferences.",
      hintTr:
        "Dahil edin: framework (React/Next.js), stillendirme (Tailwind/CSS), dil (TypeScript), kutuphaneler (shadcn, Zod) ve tasarim tercihleri.",
      placeholderEn:
        "Add context... e.g., Tech stack: React, TypeScript, Tailwind CSS. The component should...",
      placeholderTr:
        "Baglam ekleyin... ornegin, Teknoloji yigini: React, TypeScript, Tailwind CSS. Bilesen ...",
      scoring: {
        minWordCount: 15,
        keywords: [
          "react",
          "typescript",
          "tailwind",
          "next",
          "css",
          "component",
          "design",
          "style",
          "responsive",
          "mobile",
          "accessible",
          "shadcn",
          "framework",
        ],
        minKeywordMatches: 3,
      },
    },
    {
      id: 4,
      titleEn: "Define Input/Output",
      titleTr: "Girdi/Ciktiyi Tanimla",
      descriptionEn:
        "Describe what information the prompt receives and what format the output should be in.",
      descriptionTr:
        "Promptun hangi bilgileri aldigini ve ciktinin hangi formatta olmasi gerektigini tanimlayin.",
      hintEn:
        "Specify: What inputs does the component accept (props)? What should the output include (JSX, hooks, types)? What file structure?",
      hintTr:
        "Belirtin: Bilesen hangi girdileri kabul eder (props)? Cikti neler icermeli (JSX, hooks, tipler)? Hangi dosya yapisi?",
      placeholderEn:
        "Define I/O... e.g., Input: onSubmit callback, API endpoint. Output: A single React component file with...",
      placeholderTr:
        "G/C tanimlayin... ornegin, Girdi: onSubmit callback, API endpoint. Cikti: ... iceren tek bir React bilesen dosyasi",
      scoring: {
        minWordCount: 12,
        keywords: [
          "input",
          "output",
          "props",
          "return",
          "component",
          "file",
          "format",
          "callback",
          "function",
          "type",
          "interface",
          "jsx",
          "tsx",
        ],
        minKeywordMatches: 3,
      },
    },
    {
      id: 5,
      titleEn: "Add Examples",
      titleTr: "Ornekler Ekle",
      descriptionEn:
        "Provide example inputs and the kind of output you expect. This helps the AI understand the pattern.",
      descriptionTr:
        "Ornek girdiler ve beklediginiz cikti turunu saglyin. Bu AI'nin kalbi anlamasina yardimci olur.",
      hintEn:
        "Show a brief example of what the sign-in form might look like in code, or describe an example user flow: user enters email, clicks sign in, sees error/success.",
      hintTr:
        "Giris formunun kodda nasil gorunebilecegine dair kisa bir ornek gosterin veya bir kullanici akisi tanimlayin.",
      placeholderEn:
        "Add examples... e.g., Example: When user submits valid credentials, show a loading spinner then redirect to /dashboard...",
      placeholderTr:
        "Ornekler ekleyin... ornegin, Ornek: Kullanici gecerli kimlik bilgilerini gonderdiginde, yuklenme gostergesi gosterin...",
      scoring: {
        minWordCount: 15,
        keywords: [
          "example",
          "when",
          "should",
          "user",
          "click",
          "submit",
          "error",
          "success",
          "redirect",
          "loading",
          "validation",
          "message",
          "show",
        ],
        minKeywordMatches: 3,
      },
    },
    {
      id: 6,
      titleEn: "Test and Refine",
      titleTr: "Test Et ve Iyilestir",
      descriptionEn:
        "Combine all parts into a final prompt. Review it for completeness, clarity, and specificity.",
      descriptionTr:
        "Tum parcalari son bir promptta birlestirin. Tamlk, netlk ve ozgunluk acisindan gozden gecirin.",
      hintEn:
        "Copy your work from steps 1-5 and combine them into one cohesive prompt. Check: Is the goal clear? Is the role defined? Are constraints listed? Is the output format specified?",
      hintTr:
        "Adim 1-5'teki calismanizi kopyalayin ve tek bir tutarli promptta birlestirin. Kontrol edin: Hedef net mi? Rol tanimli mi? Kisitlamalar listelendi mi?",
      placeholderEn:
        "Write your final combined prompt here, bringing together the goal, role, context, I/O, and examples...",
      placeholderTr:
        "Son birlestirilmis promptunuzu buraya yazin, hedef, rol, baglam, G/C ve ornekleri bir araya getirin...",
      scoring: {
        minWordCount: 40,
        keywords: [
          "you are",
          "create",
          "sign-in",
          "react",
          "typescript",
          "component",
          "input",
          "output",
          "example",
          "role",
          "context",
          "format",
          "error",
          "validation",
        ],
        minKeywordMatches: 5,
      },
    },
  ],
};

// Score a single step based on user input
export function scoreStep(step: SimulationStep, userInput: string): number {
  if (!userInput || !userInput.trim()) return 0;

  const text = userInput.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);

  // Word count score (0-50)
  const wordRatio = Math.min(words.length / step.scoring.minWordCount, 1);
  const wordScore = wordRatio * 50;

  // Keyword match score (0-50)
  const matchedKeywords = step.scoring.keywords.filter((kw) =>
    text.includes(kw.toLowerCase())
  );
  const keywordRatio = Math.min(
    matchedKeywords.length / step.scoring.minKeywordMatches,
    1
  );
  const keywordScore = keywordRatio * 50;

  return Math.round(wordScore + keywordScore);
}

// Calculate overall simulation score from all step scores
export function calculateOverallScore(stepScores: number[]): number {
  if (stepScores.length === 0) return 0;
  const total = stepScores.reduce((a, b) => a + b, 0);
  return Math.round(total / stepScores.length);
}

// Convert 0-100 score to 1-5 star rating
export function scoreToStars(score: number): number {
  if (score >= 90) return 5;
  if (score >= 70) return 4;
  if (score >= 50) return 3;
  if (score >= 30) return 2;
  return 1;
}
