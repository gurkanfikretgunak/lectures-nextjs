import { cookies } from "next/headers";
import { getNavigation } from "@/lib/mdx";
import { LearnToPromptPage } from "./learn-to-prompt-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Learn to Prompt - Interactive Prompt Engineering Simulator",
  description:
    "Learn prompt engineering through interactive simulations with an AI assistant running entirely in your browser.",
};

export default async function LearnToPrompt() {
  const cookieStore = await cookies();
  const language = (cookieStore.get("language")?.value || "en") as "en" | "tr";
  const navigation = getNavigation(language);

  return <LearnToPromptPage navigation={navigation} />;
}
