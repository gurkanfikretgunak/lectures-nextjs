import { getNavigation } from "@/lib/mdx";
import { HomePage } from "./home-page";

export default function Home() {
  const navigation = getNavigation();

  return <HomePage navigation={navigation} />;
}
