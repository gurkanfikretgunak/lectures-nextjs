"use client";

import { PasswordGate } from "./password-gate";
import { useState, useEffect } from "react";

interface PasswordGateWrapperProps {
  enabled: boolean;
  password: string;
  message?: string;
  children: React.ReactNode;
}

export function PasswordGateWrapper({
  enabled,
  password,
  message,
  children,
}: PasswordGateWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!enabled) {
      setIsAuthenticated(true);
      return;
    }
    
    // Check if already authenticated in this session
    const checkAuth = () => {
      const authStatus = sessionStorage.getItem("lecture_auth");
      setIsAuthenticated(authStatus === "authenticated");
    };
    
    checkAuth();
    
    // Listen for storage changes (when password is entered)
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Also check periodically in case of same-tab updates
    const interval = setInterval(checkAuth, 100);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [enabled]);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // If password protection is disabled, show content immediately
  if (!enabled) {
    return <>{children}</>;
  }

  // Show password gate and block content until authenticated
  return (
    <>
      {!isAuthenticated && (
        <PasswordGate 
          password={password} 
          message={message}
          onAuthenticated={() => setIsAuthenticated(true)}
        />
      )}
      {isAuthenticated && children}
    </>
  );
}
