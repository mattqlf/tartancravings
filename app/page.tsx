import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { EnvVarWarning } from "@/components/env-var-warning";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"} className="text-2xl font-bold text-cmu-red hover:text-cmu-darkred transition-colors">
                🏴󠁧󠁢󠁳󠁣󠁴󠁿 Tartan Cravings
              </Link>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>

        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <div className="flex flex-col gap-16 items-center">
            <div className="text-center">
              <h1 className="text-4xl lg:text-6xl font-bold text-cmu-red mb-4">
                🏴󠁧󠁢󠁳󠁣󠁴󠁿 Tartan Cravings
              </h1>
              <p className="text-xl lg:text-2xl text-cmu-gray mb-8">
                Food delivery for Carnegie Mellon University
              </p>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Order from your favorite campus restaurants with distance-based pricing.
                Available exclusively for CMU students and staff with <span className="text-cmu-gold font-semibold">@andrew.cmu.edu</span> accounts.
              </p>
            </div>

            {!hasEnvVars ? (
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">Setup Required</h2>
                <p className="text-gray-600 mb-4">
                  Configure your Supabase environment variables to enable authentication.
                </p>
                <div className="text-left bg-gray-100 p-4 rounded-lg text-sm">
                  <p className="font-medium mb-2">Next steps:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Set up Supabase project and get credentials</li>
                    <li>Add credentials to .env.local file</li>
                    <li>Configure Google OAuth</li>
                    <li>Run database migrations</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4 text-cmu-red">Ready to Order?</h2>
                <p className="text-gray-600 mb-6">
                  Sign in with your Carnegie Mellon account to start ordering from campus restaurants.
                </p>
                <div className="bg-gradient-to-r from-cmu-red to-cmu-gold p-4 rounded-lg text-white mb-6">
                  <p className="font-semibold">🎓 CMU Students & Staff Only</p>
                  <p className="text-sm opacity-90">Authenticate with your @andrew.cmu.edu Google account</p>
                </div>
                <div className="space-y-4">
                  <Link
                    href="/auth/signin"
                    className="inline-block bg-white text-cmu-red font-semibold py-3 px-8 rounded-lg border-2 border-cmu-red hover:bg-cmu-red hover:text-white transition-colors"
                  >
                    Get Started →
                  </Link>
                  <div className="text-sm text-gray-500">
                    <Link href="/test-db" className="underline hover:text-cmu-red">
                      Test Database Connection
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p className="text-gray-500">
            Made with ❤️ for the CMU community
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
