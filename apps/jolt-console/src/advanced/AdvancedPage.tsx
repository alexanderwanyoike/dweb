import { Link } from "react-router-dom";
import { TaskSection, TaskRow } from "../components/TaskSection";
import { advancedRoutes } from "./navigation";
export function AdvancedPage() {
  return (
    <div className="feature-page">
      <TaskSection title="Node tools">
        {advancedRoutes
          .filter((route) => route.id !== "advanced")
          .map((route) => (
            <TaskRow
              key={route.id}
              title={route.label}
              description={route.description}
            >
              <Link to={route.path}>Open {route.label.toLowerCase()}</Link>
            </TaskRow>
          ))}
      </TaskSection>
      <p className="task-help">
        If an app cannot connect, check Home first. If another computer cannot
        reach you, inspect Network before changing relay settings.
      </p>
    </div>
  );
}
