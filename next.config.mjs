import createMDX from "@next/mdx";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

/** @type {import('rehype-pretty-code').Options} */
const rehypePrettyCodeOptions = {
  theme: "one-dark-pro",
  keepBackground: true,
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [
      rehypeSlug,
      [rehypePrettyCode, rehypePrettyCodeOptions],
    ],
  },
});

export default withMDX(nextConfig);
