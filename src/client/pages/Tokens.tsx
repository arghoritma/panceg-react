import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Layout from "../components/Layout";
import Field, { inputClass } from "../components/Field";
import type { ApiToken, SharedPageProps } from "../../shared/types";

type Status = "active" | "expired" | "revoked";

const STATUS_STYLES: Record<Status, string> = {
  active:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  expired:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  revoked:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
};

const TH_CLASS =
  "text-left px-6 py-3 border-b border-border whitespace-nowrap text-muted text-xs font-bold uppercase tracking-[0.12em] bg-bg";
const TD_CLASS =
  "text-left px-6 py-4 border-b border-border whitespace-nowrap";

function statusOf(token: ApiToken): Status {
  if (token.revokedAt) return "revoked";
  if (token.expiresAt && Date.parse(token.expiresAt) <= Date.now())
    return "expired";
  return "active";
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Tokens({
  tokens,
  apiPort,
  createdToken,
}: {
  tokens: ApiToken[];
  apiPort: number;
  createdToken: string | null;
}) {
  const user = usePage<SharedPageProps>().props.auth.user;

  const { data, setData, post, processing, errors, clearErrors, reset } =
    useForm({ name: "", expiresInDays: null as number | null });
  const [copied, setCopied] = useState(false);
  const resetRef = useRef(reset);
  resetRef.current = reset;

  // The raw token arrives only in the creation response, never in session
  // flash — clear the form once it shows up so the next create starts clean.
  useEffect(() => {
    if (!createdToken) return;
    resetRef.current();
  }, [createdToken]);

  if (!user) return null;

  const copyToken = async () => {
    if (!createdToken) return;
    try {
      await navigator.clipboard.writeText(createdToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable (permissions) — the token is selectable as text */
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    post("/tokens");
  };

  const revoke = (token: ApiToken) => {
    const ok = confirm(
      `Revoke "${token.name}"? Requests using it stop working immediately.`,
    );
    if (ok) router.post(`/tokens/${token.id}/revoke`);
  };

  return (
    <Layout>
      <Head title="API tokens" />
      <section className="grid grid-cols-[1fr_auto] items-end gap-6 max-sm:grid-cols-1">
        <div className="max-w-[650px]">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Developer access
          </p>
          <h1 className="mb-0 mt-3 text-[clamp(2rem,4vw,3rem)] font-bold leading-none tracking-[-0.045em]">
            Keys for your integrations.
          </h1>
          <p className="mb-0 mt-4 leading-7 text-muted">
            Create one personal bearer token per integration. The standalone API
            listens on port {apiPort}.
          </p>
        </div>
        <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-muted">
          {tokens.length} token{tokens.length === 1 ? "" : "s"}
        </span>
      </section>

      {createdToken ? (
        <section
          className="mt-7 mb-5 p-5 rounded-[20px] border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
          aria-label="New API token"
        >
          <p className="m-0 mb-2 text-sm font-semibold text-green-700 dark:text-green-300">
            Copy your new token now — closing this page is permanent.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-bg border border-border font-mono text-sm break-all select-all">
              {createdToken}
            </code>
            <button type="button" className="btn btn-primary py-3" onClick={copyToken}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="m-0 mt-2 text-xs text-green-700 dark:text-green-300">
            Send it as{" "}
            <code className="font-mono">
              Authorization: Bearer {createdToken.slice(0, 12)}…
            </code>{" "}
            on every API request.
          </p>
        </section>
      ) : null}

      <section className="mt-8 bg-[#332719] text-[#fff8ea] rounded-[24px] p-7 shadow-card max-sm:p-5 mb-8">
        <div className="mb-6">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-[#f4cc83]">
            New integration
          </p>
          <h2 className="text-xl m-0 mt-2">Create a token</h2>
          <p className="m-0 mt-1 text-sm text-[#dbc7a7]">
            Name it for the tool that will use it, then choose its lifetime.
          </p>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="grid grid-cols-[1fr_200px_auto] gap-4 items-end max-md:grid-cols-1">
            <Field id="token-name" label="Name" error={errors.name}>
              <input
                id="token-name"
                type="text"
                name="name"
                maxLength={60}
                placeholder="e.g. Mobile app, CI pipeline"
                className={inputClass}
                value={data.name}
                onChange={(e) => {
                  clearErrors("name");
                  setData("name", e.target.value);
                }}
              />
            </Field>
            <Field
              id="token-expiry"
              label="Expiration"
              error={errors.expiresInDays}
            >
              <select
                id="token-expiry"
                name="expiresInDays"
                className={inputClass}
                value={data.expiresInDays === null ? "never" : String(data.expiresInDays)}
                onChange={(e) => {
                  clearErrors("expiresInDays");
                  setData(
                    "expiresInDays",
                    e.target.value === "never" ? null : Number(e.target.value),
                  );
                }}
              >
                <option value="never">Never expires</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
            </Field>
            <div className="mb-4 max-md:mb-0">
              <button
                className="btn btn-primary py-3"
                type="submit"
                disabled={processing}
              >
                {processing ? "Creating…" : "Create token"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between gap-4 px-7 py-5 max-sm:px-5">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Access inventory
            </p>
            <h2 className="text-xl m-0 mt-1">Your tokens</h2>
          </div>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
            Review regularly
          </span>
        </div>
        {tokens.length === 0 ? (
          <p className="border-t border-border px-7 py-8 text-muted text-sm m-0 max-sm:px-5">
            No tokens yet. Create one above to start calling the API.
          </p>
        ) : (
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className={TH_CLASS}>Name</th>
                  <th className={TH_CLASS}>Status</th>
                  <th className={TH_CLASS}>Created</th>
                  <th className={TH_CLASS}>Expires</th>
                  <th className={TH_CLASS}>Last used</th>
                  <th className={`${TH_CLASS} text-right`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="[&>tr:last-child>td]:border-b-0">
                {tokens.map((token) => {
                  const status = statusOf(token);
                  return (
                    <tr
                      key={token.id}
                      className="transition-colors hover:bg-primary-soft/70"
                    >
                      <td className={TD_CLASS}>
                        <span className="font-semibold block">{token.name}</span>
                        <code className="text-xs text-muted font-mono">
                          {token.tokenPrefix}…
                        </code>
                      </td>
                      <td className={TD_CLASS}>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[status]}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className={`${TD_CLASS} text-muted`}>
                        {formatDateTime(token.createdAt)}
                      </td>
                      <td className={`${TD_CLASS} text-muted`}>
                        {formatDateTime(token.expiresAt)}
                      </td>
                      <td className={`${TD_CLASS} text-muted`}>
                        {formatDateTime(token.lastUsedAt)}
                      </td>
                      <td className={`${TD_CLASS} text-right`}>
                        {status !== "revoked" ? (
                          <button
                            type="button"
                            className="px-3 py-2 border border-border rounded-xl bg-transparent text-danger text-xs font-semibold cursor-pointer transition-colors hover:bg-primary-soft hover:border-red-300 disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={() => revoke(token)}
                          >
                            Revoke
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}
