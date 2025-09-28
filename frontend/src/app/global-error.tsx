'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Application Error</h2>
            <p className="text-gray-600 mb-6">
              Something went wrong. Please try refreshing the page or contact support if the problem persists.
            </p>
            <button
              onClick={() => reset()}
              className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
