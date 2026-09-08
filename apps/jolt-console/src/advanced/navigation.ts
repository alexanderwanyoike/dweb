export const advancedRoutes = [
  {
    id: "advanced",
    label: "Advanced",
    path: "/advanced",
    description: "Tools for understanding and maintaining your node."
  },
  {
    id: "relays",
    label: "Relays",
    path: "/relays",
    description: "Bootstrap addresses and home relay configuration."
  },
  {
    id: "published",
    label: "Published content",
    path: "/published",
    description: "Inspect objects associated with the selected identity."
  },
  {
    id: "cache",
    label: "Storage",
    path: "/cache",
    description: "Local cache statistics and stored objects."
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    path: "/diagnostics",
    description: "Process details, connected peers and logs."
  }
] as const;
