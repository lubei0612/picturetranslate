/**
 * Sentry React integration (optional)
 * Install @sentry/react and set VITE_SENTRY_DSN to enable:
 *   npm install @sentry/react
 *   VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sentryModule: Record<string, any> | null = null;

export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (!dsn) {
    if (import.meta.env.DEV) {
      console.info("[Sentry] DSN not configured, skipping initialization");
    }
    return;
  }

  try {
    // Dynamic import using variable to avoid static type checking
    const moduleName = "@sentry/react";
    const sentry = await import(/* @vite-ignore */ moduleName);
    sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      integrations: [sentry.browserTracingIntegration()],
      tracesSampleRate: 0.1,
    });
    sentryModule = sentry;
    console.info("[Sentry] Initialized");
  } catch {
    if (import.meta.env.DEV) {
      console.info("[Sentry] @sentry/react not installed, skipping");
    }
  }
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (sentryModule) {
    sentryModule.captureException(error, { extra: context });
  } else {
    console.error("[Error]", error, context);
  }
}
