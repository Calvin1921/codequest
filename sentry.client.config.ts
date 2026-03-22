import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release tracking
  environment: process.env.NODE_ENV,
  
  // Additional options
  debug: process.env.NODE_ENV === "development",
  
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Filter out noise
  beforeSend(event, hint) {
    // Filter out non-critical errors in development
    if (process.env.NODE_ENV === "development") {
      console.log("Sentry Event:", event)
      return null
    }
    return event
  },
})