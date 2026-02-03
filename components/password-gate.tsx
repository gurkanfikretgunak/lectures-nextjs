"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock } from "lucide-react";

interface PasswordGateProps {
  password: string;
  message?: string;
  onAuthenticated?: () => void;
}

export function PasswordGate({ password, message, onAuthenticated }: PasswordGateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputPassword, setInputPassword] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if already authenticated in this session
    const authStatus = sessionStorage.getItem("lecture_auth");
    if (authStatus === "authenticated") {
      setIsOpen(false);
      return;
    }

    // Show password dialog
    setIsOpen(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (inputPassword === password) {
      sessionStorage.setItem("lecture_auth", "authenticated");
      setIsOpen(false);
      onAuthenticated?.();
      // Trigger storage event for other components
      window.dispatchEvent(new Event("storage"));
    } else {
      setError("Incorrect password. Please try again.");
      setInputPassword("");
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Show password dialog
  return (
    <>
      <div className="fixed inset-0 bg-background z-50" />
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md z-[60]" 
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>Password Required</DialogTitle>
            <DialogDescription>
              {message || "Please enter the password to access the lectures."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter password"
                value={inputPassword}
                onChange={(e) => {
                  setInputPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e as React.FormEvent);
                  }
                }}
                autoFocus
                className={error ? "border-destructive" : ""}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Access Lectures
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
