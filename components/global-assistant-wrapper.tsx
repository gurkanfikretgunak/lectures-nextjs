"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { GeneralAssistant } from "@/components/general-assistant";

export function GlobalAssistantWrapper() {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const pathname = usePathname();
  
  // Hide assistant on Learn to Prompt page (it has its own assistant)
  const shouldShowAssistant = !pathname?.startsWith("/learn-to-prompt");

  // Expose assistant toggle function globally via window
  const toggleAssistant = useCallback(() => {
    setAssistantOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).toggleGlobalAssistant = toggleAssistant;
      (window as any).openGlobalAssistant = () => setAssistantOpen(true);
      (window as any).closeGlobalAssistant = () => setAssistantOpen(false);
    }
    
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).toggleGlobalAssistant;
        delete (window as any).openGlobalAssistant;
        delete (window as any).closeGlobalAssistant;
      }
    };
  }, [toggleAssistant]);

  if (!shouldShowAssistant) {
    return null;
  }

  return (
    <GeneralAssistant
      isOpen={assistantOpen}
      onClose={() => setAssistantOpen(false)}
    />
  );
}
