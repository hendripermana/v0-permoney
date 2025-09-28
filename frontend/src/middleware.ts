import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes (marketing and auth) that do not require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  // Static files and Next.js internals
  '/favicon.ico',
  '/_next(.*)',
  '/static(.*)',
])

// Define protected app routes that require authentication
const isProtectedAppRoute = createRouteMatcher([
  '/app(.*)',
])

// Define onboarding route
const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)',
])

// Always use Clerk middleware with custom logic
export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()

  // Allow public routes to pass through
  if (isPublicRoute(req)) {
    return
  }

  // For protected app routes, require authentication
  if (isProtectedAppRoute(req)) {
    // If not authenticated, redirect to sign-in with return URL
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
      return redirectToSignIn({ returnBackUrl: signInUrl.toString() })
    }

    // If authenticated, check onboarding status
    // For now, allow access (onboarding check will be implemented in layout)
    return
  }

  // For onboarding routes, require authentication
  if (isOnboardingRoute(req)) {
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
      return redirectToSignIn({ returnBackUrl: signInUrl.toString() })
    }
    return
  }

  // Default protection for any other routes
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
    return redirectToSignIn({ returnBackUrl: signInUrl.toString() })
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless searched
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
