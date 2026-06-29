import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8000"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
});

const serverSchema = clientSchema.extend({
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
});

/**
 * Validate and read server-side environment variables.
 * Only call this in server contexts (route handlers, server components).
 */
export function getServerEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid server environment variables:\n${message}`);
  }
  return parsed.data;
}

/**
 * Public API base URL. Safe to use on the client.
 * NEXT_PUBLIC_* values are inlined at build time by Next.js.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000/api";
