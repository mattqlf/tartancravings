import { AuthGuard } from "@/components/auth/AuthGuard"
import { AuthButton } from "@/components/auth-button"
import { ThemeSwitcher } from "@/components/theme-switcher"
import Link from "next/link"
import { AdminNavLink } from "@/components/admin/AdminNavLink"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <nav className="w-full border-b border-b-foreground/10 bg-white sticky top-0 z-50">
          <div className="w-full max-w-7xl mx-auto flex justify-between items-center p-3 px-5">
            <div className="flex gap-8 items-center">
              <Link href="/" className="text-2xl font-bold text-cmu-red hover:text-cmu-darkred transition-colors">
                🏴󠁧󠁢󠁳󠁣󠁴󠁿 Tartan Cravings
              </Link>

              <div className="hidden md:flex gap-6 text-sm font-medium">
                <Link
                  href="/restaurants"
                  className="text-gray-700 hover:text-cmu-red transition-colors"
                >
                  Restaurants
                </Link>
                <Link
                  href="/orders"
                  className="text-gray-700 hover:text-cmu-red transition-colors"
                >
                  My Orders
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-cmu-red transition-colors"
                >
                  Profile
                </Link>
                <AdminNavLink />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <AuthButton />
              <ThemeSwitcher />
            </div>
          </div>
        </nav>

        <main className="flex-1">
          {children}
        </main>

        <footer className="w-full border-t bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-5 text-center text-sm text-gray-600">
            <p>Made with ❤️ for the Carnegie Mellon University community</p>
          </div>
        </footer>
      </div>
    </AuthGuard>
  )
}