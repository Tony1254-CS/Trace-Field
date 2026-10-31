import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-6 text-center text-slate-100">
      <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-xl">
        <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          404 · Not Found
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Observation Page Not Found
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          The requested field observation or mission page does not exist or has been relocated.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          Return to Field Notebook
        </Link>
      </div>
    </div>
  );
}

