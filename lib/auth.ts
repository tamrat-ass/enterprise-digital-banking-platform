import { betterAuth } from "better-auth"
import { Pool } from "pg"

const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.V0_RUNTIME_URL || "http://localhost:3000")

const trustedOrigins = [
  baseURL,
  process.env.V0_RUNTIME_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
].filter(Boolean) as string[]

console.log("[Auth] baseURL:", baseURL)
console.log("[Auth] trustedOrigins:", trustedOrigins)

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  }),
  baseURL,
  trustedOrigins,
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-key-min-32-chars-recommended-for-production",
  emailAndPassword: {
    enabled: true,
  },
  databaseURI: process.env.DATABASE_URL,
  logger: {
    disabled: false,
    level: "debug",
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    crossSubDomainCookies: {
      enabled: true,
    },
  },
})
