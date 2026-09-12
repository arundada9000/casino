export const ROUTES = {
  home: { path: "/", label: "Home" },
  games: { path: "/games", label: "Games" },
  wallet: { path: "/wallet", label: "Wallet" },
  activity: { path: "/activity", label: "Activity" },
  profile: { path: "/profile", label: "Profile" },
  settings: { path: "/settings", label: "Settings" },
  about: { path: "/about", label: "About" },
} as const;

export type RouteId = keyof typeof ROUTES;

export const ROUTE_ORDER: RouteId[] = [
  "home",
  "games",
  "wallet",
  "activity",
  "profile",
  "settings",
  "about",
];