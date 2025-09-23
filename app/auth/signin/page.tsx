import { CMUSignInButton } from "@/components/auth/CMUSignInButton"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cmu-red/5 to-cmu-gold/5">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-cmu-red hover:text-cmu-darkred transition-colors">
            🏴󠁧󠁢󠁳󠁣󠁴󠁿 Tartan Cravings
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in with your Carnegie Mellon account
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-cmu-red/10 border border-cmu-red/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cmu-red rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📚</span>
              </div>
              <div>
                <p className="font-semibold text-cmu-red">CMU Students & Staff Only</p>
                <p className="text-sm text-gray-600">Use your @andrew.cmu.edu account</p>
              </div>
            </div>
          </div>

          <CMUSignInButton />

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have a Carnegie Mellon account?{" "}
              <a
                href="https://www.cmu.edu/computing/accounts/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cmu-red hover:text-cmu-darkred font-medium"
              >
                Learn more
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            By signing in, you agree to our terms of service and privacy policy.
            This application is exclusively for the Carnegie Mellon University community.
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-cmu-red hover:text-cmu-darkred text-sm">
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}