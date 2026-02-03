import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getLecture, getAllLectures, extractHeadings, getNavigation } from "@/lib/mdx";
import { mdxComponents } from "@/lib/mdx-components";
import { LectureLayout } from "./lecture-layout";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const lectures = getAllLectures();
  return lectures.map((lecture) => ({
    category: lecture.category,
    slug: lecture.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { category, slug } = await params;
  const lecture = getLecture(category, slug);

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
  const lecture = getLecture(category, slug);

  if (!lecture) {
    notFound();
  }

  const navigation = getNavigation();
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
