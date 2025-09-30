import Link from "next/link";

export function DeployButton() {
  return (
    <Link
      href="https://vercel.com/templates/next.js/nextjs-supabase-starter"
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center rounded-md border border-foreground/20 px-3 py-1 text-xs font-medium transition hover:border-foreground/40 hover:bg-accent"
    >
      Deploy to Vercel
    </Link>
  );
}
