import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getLecture, getAllLectures, extractHeadings, getNavigation } from "@/lib/mdx";
import { mdxComponents } from "@/lib/mdx-components";
import { LectureLayout } from "./lecture-layout";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import React from "react";

// Make this route dynamic to support language switching
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  // Generate params for both languages
  const enLectures = getAllLectures("en");
  const trLectures = getAllLectures("tr");
  
  // Combine and deduplicate
  const allLectures = [...enLectures, ...trLectures];
  const uniqueLectures = Array.from(
    new Map(allLectures.map((lecture) => [`${lecture.category}-${lecture.slug}`, lecture])).values()
  );
  
  return uniqueLectures.map((lecture) => ({
    category: lecture.category,
    slug: lecture.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { category, slug } = await params;
  // Try to get language from cookie, fallback to "en"
  const cookieStore = await cookies();
  const language = (cookieStore.get("language")?.value || "en") as "en" | "tr";
  
  const lecture = getLecture(category, slug, language);

  if (!lecture) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: `${lecture.title} | AI & LLM Lectures`,
    description: lecture.description,
  };
}

export default async function LecturePage({ params }: PageProps) {
  let category: string, slug: string;
  
  try {
    const resolvedParams = await params;
    category = resolvedParams.category;
    slug = resolvedParams.slug;
    
    if (!category || !slug) {
      notFound();
    }
    
    // Get language from cookie, default to "en"
    const cookieStore = await cookies();
    const language = (cookieStore.get("language")?.value || "en") as "en" | "tr";
    
    const lecture = getLecture(category, slug, language);

    if (!lecture || !lecture.content) {
      notFound();
    }

    const navigation = getNavigation(language);
    const headings = extractHeadings(lecture.content);

    const rehypePrettyCodeOptions = {
      theme: {
        dark: "github-dark",
        light: "github-light",
      },
      keepBackground: true,
      defaultLang: "plaintext",
    };

    // Create MDX components with lecture title to skip duplicate H1
    // Use an object to track state across component renders
    const h1State = { firstH1Seen: false };
    const componentsWithTitle = {
      ...mdxComponents,
      h1: ({ children }: { children?: React.ReactNode }) => {
        // Extract text content from children
        const extractText = (node: React.ReactNode): string => {
          if (typeof node === 'string') return node;
          if (typeof node === 'number') return String(node);
          if (Array.isArray(node)) return node.map(extractText).join('');
          if (React.isValidElement(node) && node.props.children) {
            return extractText(node.props.children);
          }
          return '';
        };
        
        const h1Text = extractText(children).trim();
        
        // Skip the first H1 if it matches the lecture title
        if (!h1State.firstH1Seen && h1Text === lecture.title.trim()) {
          h1State.firstH1Seen = true;
          return null;
        }
        
        h1State.firstH1Seen = true;
        const H1Component = mdxComponents.h1;
        if (!H1Component) {
          return <h1>{children}</h1>;
        }
        return H1Component({ children });
      },
    };

    try {
      return (
        <LectureLayout
          navigation={navigation}
          headings={headings}
          lecture={lecture}
        >
          <MDXRemote
            source={lecture.content}
            components={componentsWithTitle}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [
                  rehypeSlug,
                  [rehypePrettyCode, rehypePrettyCodeOptions],
                ],
              },
              parseFrontmatter: false, // Already parsed by gray-matter
            }}
          />
        </LectureLayout>
      );
    } catch (mdxError) {
      console.error("MDX compilation error:", mdxError);
      throw mdxError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error("Error rendering lecture page:", error);
    notFound();
  }
}
