import { useEffect, useSyncExternalStore } from "react";
export type Theme = "light" | "dark";
const changeEvent = "jolt-console-theme";
function readTheme(): Theme {
  const active = document.documentElement.dataset.theme;
  if (active === "light" || active === "dark") return active;
  try {
    return localStorage.getItem("jolt.console.theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
function subscribe(listener: () => void) {
  window.addEventListener(changeEvent, listener);
  return () => window.removeEventListener(changeEvent, listener);
}
function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("jolt.console.theme", theme);
  } catch {
    /* Appearance remains usable when persistent storage is unavailable. */
  }
  window.dispatchEvent(new Event(changeEvent));
}
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return { theme, setTheme };
}
