import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Release tracking
  environment: process.env.NODE_ENV,
  
  // Additional options
  debug: process.env.NODE_ENV === "development",
  
  // Filter out noise
  beforeSend(event, hint) {
    // Filter out non-critical errors in development
    if (process.env.NODE_ENV === "development") {
      console.log("Sentry Server Event:", event)
      return null
    }
    return event
  },
})