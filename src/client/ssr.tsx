/**
 * In-process SSR renderer. Runs inside the Hono process (no separate SSR
 * server and no prebuilt SSR bundle): `@inertiajs/react` resolves from the
 * Bun runtime directly, so `src/server/platform/inertia.ts` imports this
 * module statically and renders the page tree with react-dom/server.
 *
 * Because this module IS in src/index.ts's import graph, `bun --watch`
 * restarts the process whenever a page or component changes — which
 * re-runs buildClientAssets() in dev. No separate client watcher needed.
 */
import { createInertiaApp } from "@inertiajs/react";
import type { Page } from "@inertiajs/core";
import { renderToString } from "react-dom/server";
import { notFoundPage, pages } from "./pages";

export async function renderPage(
  page: Page,
): Promise<{ head: string[]; body: string }> {
  return createInertiaApp({
    page,
    render: renderToString,
    resolve: (name: string) => pages[`./pages/${name}.tsx`]?.default ?? notFoundPage,
    setup: ({ App, props }) => <App {...props} />,
  });
}
