import { NavLink } from "react-router-dom";
import { advancedRoutes } from "./navigation";
export function AdvancedNav() {
  return (
    <nav className="advanced-nav" aria-label="Advanced tools">
      {advancedRoutes.map((route) => (
        <NavLink key={route.id} to={route.path}>
          {route.label}
        </NavLink>
      ))}
    </nav>
  );
}
