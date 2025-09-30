import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg border border-red-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Restricted
          </h1>

          <p className="text-gray-600 mb-6">
            Tartan Cravings is exclusively available to Carnegie Mellon University
            students and staff. Please sign in with your <strong>@andrew.cmu.edu</strong> account.
          </p>

          <div className="bg-cmu-red/10 border border-cmu-red/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-cmu-red font-medium">
              📧 Required: @andrew.cmu.edu email address
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Only CMU Google Workspace accounts are accepted
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full bg-cmu-red hover:bg-cmu-darkred text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Try Again with CMU Account
            </Link>

            <Link
              href="/"
              className="block w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact{" "}
              <a
                href="https://www.cmu.edu/computing/accounts/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cmu-red hover:text-cmu-darkred"
              >
                CMU Computing Services
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}