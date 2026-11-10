import { Head, Link, usePage } from "@inertiajs/react";
import Layout from "../components/Layout";
import type { DashboardStats, SharedPageProps } from "../../shared/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard({ stats }: { stats: DashboardStats }) {
  const user = usePage<SharedPageProps>().props.auth.user;
  if (!user) return null;

  return (
    <Layout>
      <Head title="Dashboard" />
      <section className="grid grid-cols-[1fr_auto] items-end gap-6 max-sm:grid-cols-1">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Your workspace
          </p>
          <h1 className="mb-0 mt-3 text-[clamp(2rem,4vw,3rem)] font-bold leading-none tracking-[-0.045em]">
            Good to see you, {user.name.split(" ")[0]}.
          </h1>
          <p className="mb-0 mt-4 max-w-[580px] leading-7 text-muted">
            Everything is ready for your next step. Keep your account details
            current and create access for the tools you connect.
          </p>
        </div>
        <Link href="/tokens" className="btn btn-primary whitespace-nowrap">
          Create API token
        </Link>
      </section>

      <section className="mt-8 grid grid-cols-[1.3fr_.7fr] gap-5 max-lg:grid-cols-1">
        <div className="rounded-[24px] bg-[#332719] p-7 text-[#fff8ea] shadow-card max-sm:p-6">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[#f4cc83]">
            Account overview
          </p>
          <p className="mb-0 mt-5 max-w-[470px] text-3xl font-bold leading-tight tracking-tight">
            A stable base, ready when you are.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-xl bg-[#e0a644] px-4 py-2.5 text-sm font-bold text-[#332719] transition-colors hover:bg-[#f2c365] hover:no-underline"
            >
              Review profile
            </Link>
            <span className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2.5 text-sm text-[#dbc7a7]">
              Member since {formatDate(user.createdAt)}
            </span>
          </div>
        </div>
        <div className="rounded-[24px] border border-border bg-surface p-6 shadow-card">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Your access
          </p>
          <p className="mb-0 mt-5 text-2xl font-bold capitalize">{user.role}</p>
          <p className="mb-0 mt-2 text-sm leading-6 text-muted">
            Your role controls the areas available in this workspace.
          </p>
          <Link
            href="/profile"
            className="mt-6 inline-flex text-sm font-bold text-primary hover:text-primary-hover hover:no-underline"
          >
            Manage account
          </Link>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-5 max-md:grid-cols-1">
        <div className="rounded-[20px] border border-border bg-surface p-5">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-muted">
            Community
          </p>
          <p className="mb-0 mt-3 text-3xl font-bold tracking-tight">
            {stats.userCount}
          </p>
          <p className="mb-0 mt-1 text-sm text-muted">Total accounts</p>
        </div>
        <div className="rounded-[20px] border border-border bg-surface p-5">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-muted">
            Identity
          </p>
          <p className="mb-0 mt-3 text-lg font-bold truncate">{user.email}</p>
          <p className="mb-0 mt-1 text-sm text-muted">Primary email address</p>
        </div>
        <div className="rounded-[20px] border border-border bg-primary-soft p-5">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-primary">
            Next step
          </p>
          <p className="mb-0 mt-3 text-lg font-bold">Connect your tools</p>
          <Link
            href="/tokens"
            className="mt-2 inline-flex text-sm font-bold text-primary hover:text-primary-hover hover:no-underline"
          >
            Open API tokens
          </Link>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-[24px] border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between gap-4 px-6 py-5 max-sm:px-5">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Community
            </p>
            <h2 className="mb-0 mt-1 text-xl font-bold tracking-tight">
              Recently joined
            </h2>
          </div>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
            {stats.recentUsers.length} recent
          </span>
        </div>
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead className="bg-bg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  Email
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {stats.recentUsers.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-primary-soft/70">
                  <td className="border-b border-border px-6 py-4 font-semibold">
                    {u.name}
                  </td>
                  <td className="border-b border-border px-6 py-4 text-muted">
                    {u.email}
                  </td>
                  <td className="border-b border-border px-6 py-4 text-right text-muted">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}
