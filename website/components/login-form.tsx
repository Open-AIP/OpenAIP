'use client'

import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { AuthParameters } from '@/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getRolePath, getRoleEmailPlaceholder } from "@/lib/ui/auth-helpers";
import { toRouteRole } from '@/lib/supabase/proxy'

export function LoginForm({role, baseURL}:AuthParameters) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const rolePath = getRolePath(baseURL, role);
  const isStaffRole = role !== 'citizen'
  const roleBadgeLabel =
    role === 'city' ? 'City Official' : role === 'barangay' ? 'Barangay Official' : 'Admin'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = supabaseBrowser()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // check if user role matches the referrer role
      const {data: signedInRole, error: roleError} = await supabase.rpc('current_role');
      if (roleError) throw roleError

      console.log(role, signedInRole)

      const routeRole = toRouteRole(signedInRole);

      if(routeRole !== role) {
        await supabase.auth.signOut();
        throw new Error('Role Validation Failed.')
      }; 

      // route to redirect to an authenticated route. The user already has an active session.
      router.push(`/${role ===  'citizen' ? '' : role}`);

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isStaffRole) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#022034]">
        <Image
          src="/login/building.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#022437]/50" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-[#022437]/30 via-[#022437]/5 to-transparent" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-black/22 via-black/12 to-transparent" aria-hidden />
        <div
          className="absolute inset-0 [background:radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.14)_70%,rgba(0,0,0,0.26)_100%)]"
          aria-hidden
        />
        <div className="relative z-10 grid min-h-screen lg:grid-cols-5">
          <main className="order-1 flex min-h-screen items-stretch lg:order-2 lg:col-span-2">
            <div className="w-full p-4 sm:p-6 lg:p-8">
              <Card className="h-full w-full gap-0 rounded-2xl border-slate-200 bg-white shadow-xl">
              <CardHeader className="items-center space-y-5 px-9 pt-11 text-center sm:px-12">
                <Image
                  src="/brand/logo.svg"
                  alt="OpenAIP logo"
                  width={56}
                  height={56}
                  className="mx-auto h-14 w-14"
                />
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                    Welcome back!
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-slate-500 sm:text-base">
                    Sign in to continue to OpenAIP.
                  </CardDescription>
                </div>
                <span className="w-full text-center text-xl font-bold text-[#3B7A9D]">
                  {roleBadgeLabel}
                </span>
              </CardHeader>
              <CardContent className="px-9 pb-11 sm:px-12">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder={getRoleEmailPlaceholder(role)}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-slate-300 bg-white text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                        Password
                      </Label>
                      <Link
                        href={`${rolePath}/forgot-password`}
                        className="rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 border-slate-300 bg-white pr-16 text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-2 my-auto h-8 rounded-md px-2 text-sm font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="h-12 w-full text-base font-medium focus-visible:ring-2 focus-visible:ring-primary/40"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Sign in'}
                  </Button>
                  <div className="space-y-2">
                    <a
                      href="mailto:administrator@lgu.gov.ph"
                      className="inline-flex rounded-sm text-sm font-medium text-slate-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      Contact system administrator
                    </a>
                    <p className="text-sm leading-relaxed text-slate-500">
                      For account access or resets, contact your LGU administrator.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
            </div>
          </main>

          <aside className="order-2 relative min-h-[360px] overflow-hidden lg:order-1 lg:col-span-3 lg:min-h-screen">
            <Image
              src="/login/faded-logo.png"
              alt=""
              aria-hidden
              width={440}
              height={440}
              className="pointer-events-none absolute left-1/2 top-1/2 hidden h-auto w-[360px] -translate-x-1/2 -translate-y-1/2 opacity-20 lg:block"
            />

            <div className="relative z-10 flex h-full flex-col justify-between p-8 text-white sm:p-10 lg:p-14">
              <div className="flex items-center gap-3">
                <Image src="/brand/logo3.svg" alt="OpenAIP logo" width={34} height={34} className="h-8 w-8" />
                <span className="text-3xl font-semibold leading-none tracking-tight">OpenAIP</span>
              </div>
              <div className="max-w-2xl space-y-6 pb-2 lg:pb-10">
                <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                  Turn AIP documents into actionable planning data.
                </h1>
                <p className="text-base leading-relaxed text-slate-100/90 sm:text-lg">
                  OpenAIP converts Annual Investment Plans into structured, searchable records so officials can publish,
                  review, and monitor budgets and projects with clarity and accountability.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={getRoleEmailPlaceholder(role)}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {role !== 'admin' && 
                    <Link
                      href={`${rolePath}/forgot-password`}
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  }
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
            {role !== 'admin' && 
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link href={`${rolePath}/sign-up`} className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            }
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
