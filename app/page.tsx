import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Truck, ArrowRight, Package, Users, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl text-gray-900 dark:text-white">TartanCravings</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeSwitcher />
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-20 text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Choose how you want to use
            <span className="text-blue-600"> TartanCravings</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Looking for a late-night bite or extra cash between classes? Pick the
            path that fits you—order food from campus favorites or join the crew of
            student deliverers helping the community stay fueled.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-left bg-white/60 dark:bg-gray-900/60 shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                I want to order food
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Browse real-time availability, place delivery requests, and match
                with nearby student drivers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg">
                  <Link href="/restaurants">
                    Browse restaurants
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-left bg-white/60 dark:bg-gray-900/60 shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                I want to become a deliverer
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Complete a quick onboarding, choose the requests you want to take,
                and coordinate hand-offs right on campus.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg">
                  <Link href="/onboarding">
                    Start driver onboarding
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth/sign-up">Create account</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Steps */}
        <div className="py-20 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How it works
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Three simple steps to get your delivery
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Request delivery</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Describe what you need delivered
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Get matched</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Available drivers see and accept your request
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Confirm delivery</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Both parties confirm completion together
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-20 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why choose TartanCravings?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No payment processing</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Handle payments directly with your driver. We just connect you.
              </p>
            </div>

            <div className="text-center">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real-time updates</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track your delivery status with live notifications.
              </p>
            </div>

            <div className="text-center">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Dual confirmation</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Both parties must confirm delivery completion for security.
              </p>
            </div>

            <div className="text-center">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Simple interface</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Easy to use for both requesters and drivers.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Truck className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900 dark:text-white">TartanCravings</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Delivery Matchmaking Platform • Built with Next.js & Supabase
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
