import React from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

// Simple theme toggle: persists to localStorage and toggles the `dark` class on <html>
const STORAGE_KEY = "theme"; // values: 'light' | 'dark'

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null;
  if (saved === "light" || saved === "dark") return saved;
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

const applyTheme = (theme: "light" | "dark") => {
  const root = document.documentElement; // <html>
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

const ThemeToggle: React.FC<{ size?: "icon" | "default" } > = ({ size = "icon" }) => {
  const [theme, setTheme] = React.useState<"light" | "dark">(() => getInitialTheme());

  React.useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      variant="ghost"
      size={size}
      className={size === "icon" ? "rounded-full" : "gap-2"}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Icon className={size === "icon" ? "h-5 w-5" : "h-4 w-4"} />
      {size !== "icon" && (theme === "dark" ? "Light" : "Dark")}
    </Button>
  );
};

export default ThemeToggle;
