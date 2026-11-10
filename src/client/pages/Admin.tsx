import { Head, Link, usePage } from "@inertiajs/react";
import Layout from "../components/Layout";
import type { Paginated, SharedPageProps, User } from "../../shared/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const pageUrl = (p: number): string => `/admin?page=${p}`;

const TH_CLASS =
  "text-left px-3 py-2.5 border-b border-border whitespace-nowrap text-muted text-xs uppercase tracking-wider bg-bg";
const TD_CLASS =
  "text-left px-3 py-2.5 border-b border-border whitespace-nowrap";

export default function Admin({ users }: { users: Paginated<User> }) {
  const user = usePage<SharedPageProps>().props.auth.user;
  if (user?.role !== "admin") return null;

  const { currentPage, lastPage, total } = users.meta;

  return (
    <Layout>
      <Head title="Admin" />
      <h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Admin</h1>
      <p className="text-muted mb-3">
        {total} user{total === 1 ? "" : "s"} total — page {currentPage} of{" "}
        {lastPage}.
      </p>

      <section className="bg-surface border border-border rounded-radius p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={TH_CLASS}>Name</th>
                <th className={TH_CLASS}>Email</th>
                <th className={TH_CLASS}>Role</th>
                <th className={TH_CLASS}>Joined</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {users.data.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-primary-soft">
                  <td className={TD_CLASS}>{u.name}</td>
                  <td className={TD_CLASS}>{u.email}</td>
                  <td className={TD_CLASS}>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${u.role === "admin" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-primary-soft text-primary"}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className={TD_CLASS}>{formatDate(u.createdAt)}</td>
                </tr>
              ))}
              {users.data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted p-6">
                    No users yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <nav
        className="flex items-center justify-between gap-4 mt-4"
        aria-label="Pagination"
      >
        {currentPage > 1 ? (
          <Link href={pageUrl(currentPage - 1)} className="btn btn-ghost rounded-lg">
            Previous
          </Link>
        ) : (
          <span
            className="btn btn-ghost rounded-lg opacity-35 cursor-not-allowed"
            aria-disabled="true"
          >
            Previous
          </span>
        )}
        <span className="text-muted text-sm">
          Page {currentPage} of {lastPage}
        </span>
        {currentPage < lastPage ? (
          <Link href={pageUrl(currentPage + 1)} className="btn btn-ghost rounded-lg">
            Next
          </Link>
        ) : (
          <span
            className="btn btn-ghost rounded-lg opacity-35 cursor-not-allowed"
            aria-disabled="true"
          >
            Next
          </span>
        )}
      </nav>
    </Layout>
  );
}
