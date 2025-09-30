import Link from "next/link";

const steps = [
  {
    title: "Create a Supabase table",
    description:
      "Open your project in the Supabase dashboard and add a table to store the data you want to display.",
    href: "https://supabase.com/docs/guides/database/tables",
  },
  {
    title: "Populate it with sample rows",
    description:
      "Seed the table manually or with SQL so you have something to query during development.",
    href: "https://supabase.com/docs/guides/database",
  },
  {
    title: "Query it from a Next.js route",
    description:
      "Use the Supabase client inside a server component or route handler to fetch the rows and render them.",
    href: "https://supabase.com/docs/guides/getting-started/quickstarts/nextjs",
  },
];

export function FetchDataSteps() {
  return (
    <ol className="space-y-4">
      {steps.map((step) => (
        <li key={step.title} className="rounded-md border border-border/40 p-4">
          <div className="font-semibold">{step.title}</div>
          <p className="text-sm text-muted-foreground">{step.description}</p>
          <Link
            href={step.href}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Read the docs
          </Link>
        </li>
      ))}
    </ol>
  );
}
