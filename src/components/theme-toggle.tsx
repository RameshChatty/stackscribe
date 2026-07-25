"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return null;
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

function applyTheme(theme: Theme, animate = true) {
  const root = document.documentElement;
  if (!animate) root.classList.add("disable-transitions");
  root.classList.toggle("dark", theme === "dark");
  if (!animate) {
    // Force a reflow so the disable-transitions class takes effect immediately
    root.getBoundingClientRect();
    root.classList.remove("disable-transitions");
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = resolveTheme();
    setTheme(initial);
    applyTheme(initial, false);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (!getStoredTheme()) {
        const system = getSystemTheme();
        setTheme(system);
        applyTheme(system);
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [mounted]);

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }, [theme]);

  // Prevent hydration mismatch by rendering same layout with invisible icon initially
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="size-9 rounded-full"
    >
      {mounted ? (
        theme === "dark" ? (
          <Sun size={16} className="text-muted hover:text-foreground" />
        ) : (
          <Moon size={16} className="text-muted hover:text-foreground" />
        )
      ) : (
        <div className="size-4" />
      )}
    </Button>
  );
}
