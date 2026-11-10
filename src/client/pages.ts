/**
 * Page registry. Explicit imports work identically in the Bun server
 * runtime and the Bun.build client bundle (Bun 1.3 removed
 * `import.meta.glob`). Keys use the `./pages/<Name>.tsx` convention
 * that `resolve()` builds from the Inertia component name.
 */
import type { ComponentType } from "react";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Tokens from "./pages/Tokens";

// Page props differ per route; Inertia resolves the component dynamically.
// biome-ignore lint/suspicious/noExplicitAny: heterogeneous dynamic page props.
type PageModule = { default: ComponentType<any> };

export const pages: Record<string, PageModule> = {
  "./pages/Admin.tsx": { default: Admin },
  "./pages/Dashboard.tsx": { default: Dashboard },
  "./pages/ForgotPassword.tsx": { default: ForgotPassword },
  "./pages/Home.tsx": { default: Home },
  "./pages/Login.tsx": { default: Login },
  "./pages/NotFound.tsx": { default: NotFound },
  "./pages/Profile.tsx": { default: Profile },
  "./pages/Register.tsx": { default: Register },
  "./pages/ResetPassword.tsx": { default: ResetPassword },
  "./pages/Tokens.tsx": { default: Tokens },
};

/** Fallback for unknown component names — never resolve to undefined. */
// biome-ignore lint/suspicious/noExplicitAny: matches PageModule's props shape.
export const notFoundPage: ComponentType<any> =
  pages["./pages/NotFound.tsx"]?.default ?? NotFound;
