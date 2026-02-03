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

export function getLecturesByCategory(category: string): LectureMeta[] {
  const categoryPath = path.join(contentDirectory, category);
  
  if (!fs.existsSync(categoryPath)) {
    return [];
  }

  const files = fs.readdirSync(categoryPath).filter((file) => file.endsWith(".mdx"));

  const lectures = files.map((file) => {
    const filePath = path.join(categoryPath, file);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContents);
    const slug = file.replace(/\.mdx$/, "");

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

export function getAllLectures(): LectureMeta[] {
  const categories = getAllCategories();
  const allLectures: LectureMeta[] = [];

  categories.forEach((category) => {
    const lectures = getLecturesByCategory(category);
    allLectures.push(...lectures);
  });

  return allLectures;
}

export function getLecture(category: string, slug: string): LectureWithContent | null {
  const filePath = path.join(contentDirectory, category, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

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
}

// Map for special category title formatting
const categoryTitles: Record<string, string> = {
  prompting: "Prompting",
  llm: "LLM",
  "ai-tooling": "AI Tooling",
  reasoning: "Reasoning",
  resources: "Resources",
};

export function getNavigation() {
  const categories = getAllCategories();

  const navigation = categories.map((category) => {
    const lectures = getLecturesByCategory(category);
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
      })),
    };
  });

  // Sort categories in a specific order
  const categoryOrder = ["prompting", "llm", "ai-tooling", "reasoning", "resources"];
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
