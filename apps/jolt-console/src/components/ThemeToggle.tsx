import { useTheme } from "./use-theme";
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
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
