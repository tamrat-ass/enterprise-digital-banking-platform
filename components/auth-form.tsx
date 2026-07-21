"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient, customSignIn } from "@/lib/auth-client"
import { createProfile } from "@/app/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RoleKey } from "@/lib/rbac"

interface Dept {
  id: string
  name: string
}

const SELECTABLE_ROLES: { value: RoleKey; label: string }[] = [
  { value: "staff", label: "Staff Member" },
  { value: "department_head", label: "Department Head" },
  { value: "compliance_officer", label: "Compliance Officer" },
  { value: "auditor", label: "Internal Auditor" },
  { value: "executive", label: "Executive" },
]

export function AuthForm({
  mode,
  departments = [],
}: {
  mode: "sign-in" | "sign-up"
  departments?: Dept[]
}) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [roleId, setRoleId] = useState<RoleKey>("staff")
  const [departmentId, setDepartmentId] = useState<string>("")
  const [jobTitle, setJobTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === "sign-up"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (isSignUp) {
      const { error } = await authClient.signUp.email({ email, password, name })
      if (error) {
        setLoading(false)
        setError(error.message ?? "Something went wrong")
        return
      }
      try {
        await createProfile({
          roleId,
          departmentId: departmentId || null,
          jobTitle: jobTitle || null,
        })
      } catch {
        // profile creation failure should not block entry; handled on dashboard
      }
    } else {
      const result = await customSignIn(email, password)
      if (result.error) {
        setLoading(false)
        setError(result.error.message || "Invalid email or password")
        return
      }
      // Sign-in successful
      setLoading(false)
      router.push("/")
      router.refresh()
      return
    }

    setLoading(false)
    router.push("/")
    router.refresh()
  }

  return (
    <main className="min-h-svh grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-sidebar text-sidebar-foreground p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            🏦
          </div>
          <span className="text-lg font-semibold tracking-tight">Meridian</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-balance leading-tight">
            The governance backbone for modern banks
          </h2>
          <p className="mt-4 text-sidebar-foreground/70 leading-relaxed">
            Unify documents, workflows, risk, compliance and vendor oversight in
            one secure, auditable platform built for financial institutions.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Role-based access for every team",
              "Configurable multi-step approvals",
              "Immutable, regulator-ready audit trail",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-4 w-4 text-sidebar-primary">✓</span>
                <span className="text-sidebar-foreground/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-sidebar-foreground/50">
          SOC 2 Type II · ISO 27001 · Bank-grade encryption
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              🏦
            </div>
            <span className="text-lg font-semibold tracking-tight">Meridian</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isSignUp ? "Create your account" : "Sign in to Meridian"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp
              ? "Set up your access to the governance platform"
              : "Welcome back. Enter your credentials to continue."}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Jordan Rivera"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@bank.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder={isSignUp ? "At least 8 characters" : "••••••••"}
              />
            </div>

            {isSignUp && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="jobTitle">Job title</Label>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Compliance Analyst"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={roleId || ""} onValueChange={(v: string | null) => v && setRoleId(v as RoleKey)}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SELECTABLE_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={departmentId || ""} onValueChange={(v: string | null) => v && setDepartmentId(v)}>
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground -mt-1">
                  The first account created becomes the Super Administrator.
                </p>
              </>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading
                ? "Please wait…"
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            {isSignUp ? "Already have an account? " : "Need an account? "}
            <Link
              href={isSignUp ? "/sign-in" : "/sign-up"}
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
