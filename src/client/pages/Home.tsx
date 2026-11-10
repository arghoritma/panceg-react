import { Head, Link } from "@inertiajs/react";
import Brand from "../components/Brand";
import { useSession } from "../session";

/**
 * Public landing page — CDN-cacheable.
 *
 * This page is rendered with `{ public: true }` on the server, so the HTML
 * contains no `auth.user` in the Inertia page props. User identity is
 * fetched client-side via `useSession()` → `GET /api/session` after
 * hydration. SSR renders with `user: null` (guest state), and the initial
 * client render matches — no hydration mismatch.
 */
export default function Home() {
  const { user, loading } = useSession();

  return (
    <main className="min-h-screen overflow-hidden bg-bg text-text">
      <Head title="Panceg" />
      <div className="mx-auto max-w-[1240px] px-5 py-5 max-md:px-4">
        <header className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface/90 px-5 py-3 shadow-card backdrop-blur max-sm:px-4">
          <Brand href="/" className="text-lg" />
          {loading ? null : (
            <div className="flex items-center gap-2">
              {user ? (
                <Link href="/dashboard" className="btn btn-primary">
                  Open workspace
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden px-3 py-2 text-sm font-semibold text-text hover:text-primary hover:no-underline sm:inline-flex"
                  >
                    Sign in
                  </Link>
                  <Link href="/register" className="btn btn-primary">
                    Start free
                  </Link>
                </>
              )}
            </div>
          )}
        </header>

        <section className="grid min-h-[650px] grid-cols-[1.08fr_.92fr] items-center gap-12 py-14 max-lg:grid-cols-1 max-lg:gap-8 max-sm:py-10">
          <div className="max-w-[650px]">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              A steadier starting point
            </p>
            <h1 className="m-0 max-w-[620px] text-[clamp(3.1rem,7vw,6.1rem)] font-bold leading-[0.94] tracking-[-0.065em]">
              Build the part that matters.
            </h1>
            <p className="mt-7 max-w-[540px] text-lg leading-8 text-muted max-sm:text-base max-sm:leading-7">
              Panceg gives your next product a considered foundation: secure
              accounts, a clean application shell, server rendering, and room to
              make it yours.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              {loading ? (
                <span
                  className="h-11 w-32 animate-pulse rounded-lg bg-primary-soft"
                  role="status"
                  aria-label="Loading"
                />
              ) : user ? (
                <Link href="/dashboard" className="btn btn-primary px-5 py-3">
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn btn-primary px-5 py-3">
                    Create your account
                  </Link>
                  <Link href="/login" className="btn btn-ghost px-5 py-3">
                    I already have an account
                  </Link>
                </>
              )}
            </div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted">
              <span>Authentication included</span>
              <span>SQLite by default</span>
              <span>SSR ready</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[490px]">
            <div className="absolute -inset-8 -z-10 rounded-[40px] bg-primary-soft/75 blur-2xl" />
            <div className="rounded-[28px] border border-border bg-surface p-4 shadow-card max-sm:p-3">
              <div className="rounded-[20px] bg-[#332719] p-6 text-[#fff8ea] max-sm:p-5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-[#f4cc83]">
                  <span>Workspace</span>
                  <span>Today</span>
                </div>
                <p className="mb-2 mt-12 text-3xl font-bold tracking-tight">
                  A clear place to start.
                </p>
                <p className="m-0 max-w-[310px] text-sm leading-6 text-[#dbc7a7]">
                  Your foundation handles the baseline, so every new screen can
                  be deliberate.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="m-0 text-xs text-[#dbc7a7]">Built for</p>
                    <p className="mb-0 mt-2 text-lg font-bold">Momentum</p>
                  </div>
                  <div className="rounded-2xl bg-[#e0a644] p-4 text-[#332719]">
                    <p className="m-0 text-xs font-semibold">Your stack</p>
                    <p className="mb-0 mt-2 text-lg font-bold">Your rules</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4 rounded-[20px] bg-bg px-5 py-4">
                <div>
                  <p className="m-0 text-sm font-bold">Designed to adapt</p>
                  <p className="mb-0 mt-1 text-xs text-muted">
                    A calm base for product work.
                  </p>
                </div>
                <span className="h-10 w-10 rounded-full bg-primary-soft" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
