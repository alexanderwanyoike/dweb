import { TaskSection, TaskRow } from "../components/TaskSection";
import { useTheme, type Theme } from "../components/use-theme";
export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <TaskSection title="Appearance">
      <TaskRow title="Theme" description="Choose a light or dark appearance.">
        <select
          aria-label="App theme"
          value={theme}
          onChange={(event) => setTheme(event.target.value as Theme)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </TaskRow>
    </TaskSection>
  );
}
