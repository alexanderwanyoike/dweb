import { advancedRoutes } from "../advanced";
export const primaryRoutes = [
  {
    id: "overview",
    label: "Home",
    path: "/",
    description: "Your local connection, at a glance.",
  },
  {
    id: "identity",
    label: "Identity",
    path: "/identity",
    description: "The identities available on this computer.",
  },
  {
    id: "apps",
    label: "Apps",
    path: "/apps",
    description: "Choose what can act with your identity.",
  },
  {
    id: "network",
    label: "Network",
    path: "/network",
    description: "Connection evidence, with its limits in view.",
  },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    description: "Preferences and controls for this computer.",
  },
  advancedRoutes[0],
];
export const consoleRoutes = [...primaryRoutes, ...advancedRoutes.slice(1)];
export type ConsoleRouteId = (typeof consoleRoutes)[number]["id"];
