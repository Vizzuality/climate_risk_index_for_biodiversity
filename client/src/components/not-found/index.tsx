import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl text-slate-700 font-semibold">Page not found</h1>
      <p className="text-slate-400">The page you are looking for does not exist.</p>
      <Link to="/areas" className="text-sm text-slate-700 underline">
        Go to marine conservation areas
      </Link>
    </main>
  );
}
