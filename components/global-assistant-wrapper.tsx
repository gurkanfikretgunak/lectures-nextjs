"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { GeneralAssistant } from "@/components/general-assistant";

// Extend Window interface for global assistant functions
declare global {
  interface Window {
    toggleGlobalAssistant?: () => void;
    openGlobalAssistant?: () => void;
    closeGlobalAssistant?: () => void;
  }
}

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
      window.toggleGlobalAssistant = toggleAssistant;
      window.openGlobalAssistant = () => setAssistantOpen(true);
      window.closeGlobalAssistant = () => setAssistantOpen(false);
    }
    
    return () => {
      if (typeof window !== "undefined") {
        delete window.toggleGlobalAssistant;
        delete window.openGlobalAssistant;
        delete window.closeGlobalAssistant;
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
