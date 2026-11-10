import { Head, Link, useForm } from "@inertiajs/react";
import type { FormEvent } from "react";
import AuthLayout from "../components/AuthLayout";
import Field, { inputClass } from "../components/Field";

export default function Register({
  googleEnabled = false,
}: {
  googleEnabled?: boolean;
}) {
  const { data, setData, post, processing, errors, clearErrors } = useForm({
    name: "",
    email: "",
    password: "",
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    post("/register");
  };

  return (
    <AuthLayout>
      <Head title="Register" />
      <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-primary">
        Make it yours
      </p>
      <h1 className="mb-2 mt-3 text-[2rem] font-bold leading-none tracking-tight">
        Create your account.
      </h1>
      <p className="text-muted mb-7">
        Set up your space and begin with a dependable foundation.
      </p>

      {googleEnabled ? (
        <>
          <a className="btn btn-ghost w-full py-3 bg-bg" href="/auth/google">
            Register with Google
          </a>
          <div className="flex items-center gap-3 text-muted text-xs my-5">
            <span className="flex-1 h-px bg-border" />
            or
            <span className="flex-1 h-px bg-border" />
          </div>
        </>
      ) : null}

      <form onSubmit={submit} noValidate>
        <Field id="name" label="Name" error={errors.name}>
          <input
            id="name"
            type="text"
            name="name"
            autoComplete="name"
            className={inputClass}
            value={data.name}
            onChange={(e) => {
              clearErrors("name");
              setData("name", e.target.value);
            }}
          />
        </Field>

        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            className={inputClass}
            value={data.email}
            onChange={(e) => {
              clearErrors("email");
              setData("email", e.target.value);
            }}
          />
        </Field>

        <Field id="password" label="Password" error={errors.password}>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="new-password"
            className={inputClass}
            value={data.password}
            onChange={(e) => {
              clearErrors("password");
              setData("password", e.target.value);
            }}
          />
          <p className="text-xs text-muted mt-1">At least 8 characters.</p>
        </Field>

        <button
          className="btn btn-primary w-full py-3"
          type="submit"
          disabled={processing}
        >
          {processing ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-muted text-sm">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
