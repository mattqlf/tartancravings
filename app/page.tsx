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
            Connect with
            <span className="text-blue-600"> delivery drivers</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Request deliveries instantly. Drivers accept and complete your orders.
            Pure matchmaking platform with no payment processing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
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
