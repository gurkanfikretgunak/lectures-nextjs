import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { PasswordGateWrapper } from "@/components/password-gate-wrapper";
import { GlobalAssistantWrapper } from "@/components/global-assistant-wrapper";
import { Footer } from "@/components/layout/footer";
import { getPasswordConfig } from "@/lib/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
});

export const metadata: Metadata = {
  title: "AI & LLM Lectures",
  description: "Lecture resources for AI, LLM, and Prompt Engineering courses",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png", sizes: "512x512" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const passwordConfig = getPasswordConfig();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${firaCode.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <PasswordGateWrapper
              enabled={passwordConfig.enabled}
              password={passwordConfig.value}
              message={passwordConfig.message}
            >
              <div className="flex flex-col min-h-screen">
                <div className="flex-1">
                  {children}
                </div>
                <Footer />
              </div>
              <GlobalAssistantWrapper />
            </PasswordGateWrapper>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
