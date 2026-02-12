import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require authentication — redirect to / if not signed in
const isProtectedRoute = createRouteMatcher([
  '/intelligence(.*)',
  '/settings(.*)',
]);

// All other routes are public (no auth required):
// /, /discover, /company/*, /investor/*, /job/*, /fundraises, /pricing,
// /sign-in, /sign-up, /terms, /privacy, /api/*, etc.

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
