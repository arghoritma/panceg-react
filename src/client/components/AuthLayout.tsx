import type { ReactNode } from "react";
import Brand from "./Brand";

/** Split-panel layout for the guest pages (login / register / password reset). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-bg p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1180px] grid-cols-[.88fr_1.12fr] overflow-hidden rounded-[28px] border border-border bg-surface shadow-card max-lg:grid-cols-1 sm:min-h-[calc(100vh-3rem)]">
        <section className="relative flex min-h-[360px] flex-col justify-between overflow-hidden bg-[#332719] p-8 text-[#fff8ea] max-lg:min-h-0 max-lg:p-7 max-sm:p-6">
          <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#e0a644]/25 blur-3xl" />
          <Brand
            href="/"
            className="relative text-[#fff8ea] [&_svg]:text-[#e0a644]"
          />
          <div className="relative max-w-[350px] max-lg:mt-20">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.18em] text-[#f4cc83]">
              Panceg foundation
            </p>
            <h2 className="mb-0 mt-4 text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[0.98] tracking-[-0.05em]">
              Start with less noise.
            </h2>
            <p className="mb-0 mt-5 text-sm leading-6 text-[#dbc7a7]">
              A dependable base for the work you are ready to make your own.
            </p>
          </div>
          <p className="relative mb-0 mt-12 text-xs text-[#cdb58e] max-lg:hidden">
            Bun · Hono · React · SQLite
          </p>
        </section>
        <section className="flex items-center justify-center p-8 max-sm:p-6">
          <div className="w-full max-w-[410px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
