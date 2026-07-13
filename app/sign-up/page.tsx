import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { db } from "@/lib/db"
import { departments } from "@/lib/db/schema"

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/dashboard")

  const depts = await db.select().from(departments)

  return <AuthForm mode="sign-up" departments={depts} />
}
