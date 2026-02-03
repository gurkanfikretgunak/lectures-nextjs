import { cookies } from "next/headers";
import { getNavigation } from "@/lib/mdx";
import { HomePage } from "./home-page";

// Make this route dynamic to support language switching
export const dynamic = "force-dynamic";

export default async function Home() {
  // Get language from cookie, default to "en"
  const cookieStore = await cookies();
  const language = (cookieStore.get("language")?.value || "en") as "en" | "tr";
  
  const navigation = getNavigation(language);

  return <HomePage navigation={navigation} />;
}
