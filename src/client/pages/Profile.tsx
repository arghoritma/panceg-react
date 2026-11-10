import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Layout from "../components/Layout";
import Field, { inputClass } from "../components/Field";
import type { SharedPageProps } from "../../shared/types";

type Phase = "idle" | "uploading" | "done" | "error";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default function Profile() {
  const user = usePage<SharedPageProps>().props.auth.user;

  const info = useForm({ name: user?.name ?? "", email: user?.email ?? "" });
  const pass = useForm({
    currentPassword: "",
    password: "",
    passwordConfirmation: "",
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  if (!user) return null;

  /** Upload an avatar via regular multipart form-data. Files ≤ 100 MB use
   *  this path; the tus protocol at /uploads is reserved for larger
   *  resumable uploads. The server decodes, resizes and re-encodes the
   *  image to WebP with Bun's Image before storing it. */
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const file = target.files?.[0];
    target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setPhase("uploading");
    setMessage(null);
    setProgress(0);
    setSelectedName(file.name);

    const fd = new FormData();
    fd.append("avatar", file);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable)
        setProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 204) {
        setPhase("done");
        setSelectedName(null);
        router.reload();
      } else {
        setPhase("error");
        setMessage(`Request failed (HTTP ${xhr.status})`);
      }
    };
    xhr.onerror = () => {
      setPhase("error");
      setMessage("Network error");
    };
    xhr.open("POST", "/profile/avatar");
    xhr.send(fd);
  };

  const submitInfo = (e: FormEvent) => {
    e.preventDefault();
    info.patch("/profile");
  };

  const submitPass = (e: FormEvent) => {
    e.preventDefault();
    pass.post("/profile/password");
  };

  return (
    <Layout>
      <Head title="Profile" />
      <div className="max-w-[650px]">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Account settings
        </p>
        <h1 className="mb-0 mt-3 text-[clamp(2rem,4vw,3rem)] font-bold leading-none tracking-[-0.045em]">
          Your profile, on your terms.
        </h1>
        <p className="mb-0 mt-4 leading-7 text-muted">
          Keep your identity, contact details, and sign-in security up to date.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-[320px_1fr] gap-5 items-start max-md:grid-cols-1">
        <aside className="flex flex-col gap-4">
          <section className="bg-[#332719] text-[#fff8ea] rounded-[24px] p-7 flex flex-col items-center text-center gap-2 shadow-card">
            {user.avatarUrl ? (
              <img
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white/15"
                src={user.avatarUrl}
                alt=""
              />
            ) : (
              <span
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#e0a644] text-[#332719] text-2xl font-bold shrink-0"
                aria-hidden="true"
              >
                {initials(user.name)}
              </span>
            )}
            <h2 className="m-0 mt-2 text-xl">{user.name}</h2>
            <p className="text-[#dbc7a7] m-0 text-sm break-all">{user.email}</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-[#e0a644] text-[#332719]">
                {user.role}
              </span>
              <span className="text-[#dbc7a7] text-sm">
                Member since {formatDate(user.createdAt)}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2 w-full mt-3">
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                hidden
                onChange={onFile}
              />
              <button
                type="button"
                className="btn btn-primary py-3"
                disabled={phase === "uploading"}
                onClick={() => inputRef.current?.click()}
              >
                {phase === "uploading" ? "Uploading…" : "Change avatar"}
              </button>
              {selectedName ? (
                <span className="text-[#dbc7a7] text-sm">{selectedName}</span>
              ) : null}
              {message ? (
                <p className="text-[#fca5a5] text-sm m-0">{message}</p>
              ) : null}
              {phase === "uploading" ? (
                <div
                  className="mt-4 h-2 w-full rounded-full bg-white/15 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-[#e0a644] transition-[width] duration-[120ms] ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : null}
              {phase === "done" ? (
                <p className="text-[#86efac] font-semibold mt-3 m-0">
                  Avatar updated.
                </p>
              ) : null}
            </div>
          </section>
        </aside>

        <div className="flex flex-col gap-5">
          <section className="bg-surface border border-border rounded-[24px] p-7 shadow-card max-sm:p-5">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Identity
            </p>
            <h2 className="text-xl m-0 mt-2 mb-1">Profile information</h2>
            <p className="m-0 mb-6 text-sm text-muted">
              These details are used across your workspace.
            </p>
            <form onSubmit={submitInfo} noValidate>
              <Field id="name" label="Name" error={info.errors.name}>
                <input
                  id="name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  className={inputClass}
                  value={info.data.name}
                  onChange={(e) => {
                    info.clearErrors("name");
                    info.setData("name", e.target.value);
                  }}
                />
              </Field>
              <Field id="email" label="Email" error={info.errors.email}>
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  className={inputClass}
                  value={info.data.email}
                  onChange={(e) => {
                    info.clearErrors("email");
                    info.setData("email", e.target.value);
                  }}
                />
              </Field>
              <button
                className="btn btn-primary py-3"
                type="submit"
                disabled={info.processing}
              >
                {info.processing ? "Saving…" : "Save changes"}
              </button>
            </form>
          </section>

          <section className="bg-surface border border-border rounded-[24px] p-7 shadow-card max-sm:p-5">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Security
            </p>
            <h2 className="text-xl m-0 mt-2 mb-1">Change password</h2>
            <p className="m-0 mb-6 text-sm text-muted">
              Use a unique password that you do not reuse elsewhere.
            </p>
            <form onSubmit={submitPass} noValidate>
              <Field
                id="currentPassword"
                label="Current password"
                error={pass.errors.currentPassword}
              >
                <input
                  id="currentPassword"
                  type="password"
                  name="currentPassword"
                  autoComplete="current-password"
                  className={inputClass}
                  value={pass.data.currentPassword}
                  onChange={(e) => {
                    pass.clearErrors("currentPassword");
                    pass.setData("currentPassword", e.target.value);
                  }}
                />
              </Field>
              <Field id="password" label="New password" error={pass.errors.password}>
                <input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  className={inputClass}
                  value={pass.data.password}
                  onChange={(e) => {
                    pass.clearErrors("password");
                    pass.setData("password", e.target.value);
                  }}
                />
              </Field>
              <Field
                id="passwordConfirmation"
                label="Confirm new password"
                error={pass.errors.passwordConfirmation}
              >
                <input
                  id="passwordConfirmation"
                  type="password"
                  name="passwordConfirmation"
                  autoComplete="new-password"
                  className={inputClass}
                  value={pass.data.passwordConfirmation}
                  onChange={(e) => {
                    pass.clearErrors("passwordConfirmation");
                    pass.setData("passwordConfirmation", e.target.value);
                  }}
                />
              </Field>
              <button
                className="btn btn-primary py-3"
                type="submit"
                disabled={pass.processing}
              >
                {pass.processing ? "Updating…" : "Update password"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </Layout>
  );
}
