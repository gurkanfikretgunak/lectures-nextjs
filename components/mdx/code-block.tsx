"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  "data-language"?: string;
}

export function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const language = props["data-language"];

  const copyToClipboard = async () => {
    const codeElement = document.querySelector(`[data-language="${language}"] code`);
    const text = codeElement?.textContent || "";
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative group my-6">
      {language && (
        <div className="absolute top-0 left-4 -translate-y-1/2 px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded text-muted-foreground">
          {language}
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={copyToClipboard}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      <pre
        className={cn(
          "overflow-x-auto rounded-lg border border-border bg-muted p-4 pt-6 font-mono text-sm",
          className
        )}
        {...props}
      >
        {children}
      </pre>
    </div>
  );
}
