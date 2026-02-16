import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDirectory = path.join(process.cwd(), "content");

export interface LectureMeta {
  title: string;
  description: string;
  category: string;
  level: number;
  order: number;
  slug: string;
}

export interface LectureWithContent extends LectureMeta {
  content: string;
}

export function getAllCategories(): string[] {
  return fs.readdirSync(contentDirectory).filter((file) => {
    return fs.statSync(path.join(contentDirectory, file)).isDirectory();
  });
}

export function getLecturesByCategory(category: string, language: "en" | "tr" = "en"): LectureMeta[] {
  const categoryPath = path.join(contentDirectory, category);
  
  if (!fs.existsSync(categoryPath)) {
    return [];
  }

  // Get all .mdx files
  const allFiles = fs.readdirSync(categoryPath).filter((file) => file.endsWith(".mdx"));
  
  // Extract unique slugs (remove language suffix)
  const slugMap = new Map<string, { file: string; priority: number }>();
  
  allFiles.forEach((file) => {
    let slug = file.replace(/\.mdx$/, "");
    let priority = 0;
    
    // For English: prioritize default .mdx files over .en.mdx files
    // For Turkish: prioritize .tr.mdx files over default .mdx files
    if (language === "en") {
      if (file.endsWith(`.tr.mdx`)) {
        // Skip Turkish files when language is English
        return;
      } else if (file.endsWith(`.en.mdx`)) {
        // Explicit English file - lower priority than default
        slug = slug.replace(`.en`, "");
        priority = 1;
      } else {
        // Default file (no language suffix) - highest priority for English
        priority = 2;
      }
    } else {
      // Turkish language
      if (file.endsWith(`.tr.mdx`)) {
        // Turkish-specific file gets highest priority
        slug = slug.replace(`.tr`, "");
        priority = 2;
      } else if (file.endsWith(`.en.mdx`)) {
        // Skip explicit English files when language is Turkish
        return;
      } else {
        // Default file (no language suffix) - lower priority for Turkish
        priority = 1;
      }
    }
    
    // Use this file if we don't have one yet, or if it has higher priority
    const existing = slugMap.get(slug);
    if (!existing || priority > existing.priority) {
      slugMap.set(slug, { file, priority });
    }
  });

  const lectures = Array.from(slugMap.entries()).map(([slug, { file }]) => {
    const filePath = path.join(categoryPath, file);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContents);

    return {
      title: data.title || slug,
      description: data.description || "",
      category: category,
      level: data.level || 100,
      order: data.order || 0,
      slug,
    } as LectureMeta;
  });

  return lectures.sort((a, b) => a.order - b.order);
}

export function getAllLectures(language: "en" | "tr" = "en"): LectureMeta[] {
  const categories = getAllCategories();
  const allLectures: LectureMeta[] = [];

  categories.forEach((category) => {
    const lectures = getLecturesByCategory(category, language);
    allLectures.push(...lectures);
  });

  return allLectures;
}

export function getLecture(category: string, slug: string, language: "en" | "tr" = "en"): LectureWithContent | null {
  let filePath: string;
  
  // For English, prioritize default .mdx files (most English files don't have .en suffix)
  // For Turkish, prioritize .tr.mdx files
  if (language === "en") {
    // Try default English file first (e.g., 101.mdx)
    filePath = path.join(contentDirectory, category, `${slug}.mdx`);
    
    // If default doesn't exist, try .en.mdx (for explicit English files)
    if (!fs.existsSync(filePath)) {
      filePath = path.join(contentDirectory, category, `${slug}.en.mdx`);
    }
  } else {
    // For Turkish, try .tr.mdx first
    filePath = path.join(contentDirectory, category, `${slug}.tr.mdx`);
    
    // If Turkish file doesn't exist, fall back to default English file
    if (!fs.existsSync(filePath)) {
      filePath = path.join(contentDirectory, category, `${slug}.mdx`);
    }
  }

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      title: data.title || slug,
      description: data.description || "",
      category: category,
      level: data.level || 100,
      order: data.order || 0,
      slug,
      content,
    };
  } catch {
    return null;
  }
}

// Map for special category title formatting
const categoryTitles: Record<string, string> = {
  prompting: "Prompting",
  llm: "LLM",
  "ai-tooling": "AI Tooling",
  mcp: "MCP",
  reasoning: "Reasoning",
  applications: "AI Applications",
  resources: "Resources",
};

export function getNavigation(language: "en" | "tr" = "en") {
  const categories = getAllCategories();

  const navigation = categories.map((category) => {
    const lectures = getLecturesByCategory(category, language);
    
    // Use predefined title or format automatically
    const formattedCategory = categoryTitles[category] || category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return {
      title: formattedCategory,
      slug: category,
      items: lectures.map((lecture) => ({
        title: lecture.title,
        href: `/${category}/${lecture.slug}`,
        level: lecture.level,
        description: lecture.description,
        slug: lecture.slug,
      })),
    };
  });

  // Sort categories in a specific order
  const categoryOrder = ["prompting", "llm", "ai-tooling", "mcp", "reasoning", "applications", "resources"];
  navigation.sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.slug);
    const bIndex = categoryOrder.indexOf(b.slug);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
  
  return navigation;
}

export function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    headings.push({ id, text, level });
  }

  return headings;
}
