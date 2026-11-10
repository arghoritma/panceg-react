import { Head, Link, useForm } from "@inertiajs/react";
import type { FormEvent } from "react";
import AuthLayout from "../components/AuthLayout";
import Field, { inputClassSm } from "../components/Field";

export default function ForgotPassword({ status }: { status?: string }) {
  const { data, setData, post, processing, errors, clearErrors } = useForm({
    email: "",
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    post("/forgot-password");
  };

  return (
    <AuthLayout>
      <Head title="Forgot password" />
      <h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">
        Reset your password
      </h1>
      <p className="text-muted mb-5">
        Enter your email and we will send you a reset link.
      </p>

      {status === "sent" ? (
        <div
          className="px-4 py-3 rounded-lg text-sm mb-5 border border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
          role="status"
        >
          If that email is registered, a reset link has been sent. Check your
          inbox.
        </div>
      ) : null}

      <form onSubmit={submit} noValidate>
        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            className={inputClassSm}
            value={data.email}
            onChange={(e) => {
              clearErrors("email");
              setData("email", e.target.value);
            }}
          />
        </Field>

        <button
          className="btn btn-primary w-full rounded-lg"
          type="submit"
          disabled={processing}
        >
          {processing ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-5 text-center text-muted text-sm">
        Remembered it? <Link href="/login">Back to login</Link>
      </p>
    </AuthLayout>
  );
}
