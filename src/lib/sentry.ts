import * as Sentry from "@sentry/nextjs";

export function captureError(
  error: unknown,
  context: Record<string, string>
): void {
  Sentry.captureException(error, {
    extra: context,
  });
}
