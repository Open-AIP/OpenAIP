import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { RoleType } from '@/lib/contracts/databasev2'

type RouteRole = 'citizen' | 'barangay' | 'city' | 'municipality' | 'admin'

function isRoleType(value: unknown): value is RoleType {
  return (
    value === 'citizen' ||
    value === 'barangay_official' ||
    value === 'city_official' ||
    value === 'municipal_official' ||
    value === 'admin'
  )
}

function toRouteRole(role: RoleType): RouteRole {
  if (role === 'barangay_official') return 'barangay'
  if (role === 'city_official') return 'city'
  if (role === 'municipal_official') return 'municipality'
  return role
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims as Record<string, unknown> | undefined
  const userId =
    claims && typeof claims.sub === 'string'
      ? claims.sub
      : claims && typeof claims.user_id === 'string'
      ? claims.user_id
      : claims && typeof claims.id === 'string'
      ? claims.id
      : null

  let userRole: RouteRole | null = null
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (isRoleType(profile?.role)) {
      userRole = toRouteRole(profile.role)
    }
  }

  const pathname = request.nextUrl.pathname;
  const pathArray = pathname.includes('/') && pathname.trim() !== '/' ? pathname.split('/') : [];

  const pathRole = pathArray.indexOf('barangay') > 0 ? 
    'barangay' : 
    pathArray.indexOf('municipality') > 0 ? 
    'municipality' : 
    pathArray.indexOf('city') > 0 ? 
    'city' : 
    pathArray.indexOf('admin') > 0 ? 
    'admin' : 
    'citizen';

  if (
    !userId && 
    !request.nextUrl.pathname.endsWith('/sign-in') &&
    !request.nextUrl.pathname.endsWith('/sign-up') &&
    !request.nextUrl.pathname.endsWith('/forgot-password') &&
    !request.nextUrl.pathname.endsWith('/update-password') 
  ) {
    const url = request.nextUrl.clone()
    url.pathname = `${pathRole === 'citizen' ? '' : '/' + pathRole}/sign-in`
    return NextResponse.redirect(url)
  }
  
  if (userId && !userRole && pathRole !== 'citizen') {
    const url = request.nextUrl.clone()
    url.pathname = `/${pathRole}/unauthorized`
    return NextResponse.redirect(url)
  }

  // signed in user accessing different role
  if(userId && userRole && pathRole !== userRole) {
    const url = request.nextUrl.clone()
    url.pathname = `${userRole === 'citizen' ? '' : '/' + userRole}/unauthorized`
    return NextResponse.redirect(url)
  }
  if (
    userId && (
      request.nextUrl.pathname.endsWith('/sign-in') ||
      request.nextUrl.pathname.endsWith('/sign-up') ||
      request.nextUrl.pathname.endsWith('/forgot-password')
    )
  ) {
    const signedInRole = userRole ?? 'citizen'
    const url = request.nextUrl.clone()
    url.pathname = `${signedInRole === 'citizen' ? '' : '/' + signedInRole}/`
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
