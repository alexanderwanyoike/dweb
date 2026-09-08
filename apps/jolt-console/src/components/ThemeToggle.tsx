import { useEffect, useState } from "react";
type Theme = "light" | "dark";
function savedTheme(): Theme {
  try {
    return localStorage.getItem("jolt.console.theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(savedTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("jolt.console.theme", theme);
    } catch {
      /* Appearance remains usable when persistent storage is unavailable. */
    }
  }, [theme]);
  const next = theme === "light" ? "dark" : "light";
  return (
    <button
      className="theme-toggle"
      aria-label={`Use ${next} appearance`}
      onClick={() => setTheme(next)}
    >
      <span aria-hidden="true">{theme === "light" ? "◐" : "☼"}</span>{" "}
      {theme === "light" ? "Light" : "Dark"}
    </button>
  );
}
