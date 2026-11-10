import { Head, Link } from "@inertiajs/react";
import Layout from "../components/Layout";

export default function NotFound() {
  return (
    <Layout>
      <Head title="Not found" />
      <h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">
        404 — page not found
      </h1>
      <p className="text-muted">The page you are looking for does not exist.</p>
      <p>
        <Link href="/dashboard" className="btn btn-primary rounded-lg">
          Go to dashboard
        </Link>
      </p>
    </Layout>
  );
}
