import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getLecture, getAllLectures, extractHeadings, getNavigation } from "@/lib/mdx";
import { mdxComponents } from "@/lib/mdx-components";
import { LectureLayout } from "./lecture-layout";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";

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
  const { category, slug } = await params;
  
  // Get language from cookie, default to "en"
  const cookieStore = await cookies();
  const language = (cookieStore.get("language")?.value || "en") as "en" | "tr";
  
  const lecture = getLecture(category, slug, language);

  if (!lecture) {
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

  return (
    <LectureLayout
      navigation={navigation}
      headings={headings}
      lecture={lecture}
    >
      <MDXRemote
        source={lecture.content}
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [rehypePrettyCode, rehypePrettyCodeOptions],
            ],
          },
        }}
      />
    </LectureLayout>
  );
}
