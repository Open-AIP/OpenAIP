import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  dbRoleToRouteRole,
  normalizeToDbRole,
  routeRoleToDbRole,
  type RouteRole,
} from "@/lib/auth/roles";
// This is only temp for accessing the citizen routes without authentication. Remove this function if you want to protect the citizen routes as well.

function isPublicCitizenPath(pathname: string) {
  if (pathname === '/') return true;

  const prefixes = [
    '/dashboard',
    '/aips',
    '/budget-allocation',
    '/budget-distribution',
    '/projects',
    '/about-us',
    '/chatbot',
    '/account',
    '/sign-in',
    '/sign-up',
    '/sign-up-success',
    '/forgot-password',
    '/update-password',
    '/confirm',
    '/error',
  ];

  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function getPathRole(pathname: string): RouteRole {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.includes("admin")) return "admin";
  if (segments.includes("barangay")) return "barangay";
  if (segments.includes("city")) return "city";
  if (segments.includes("municipality")) return "municipality";
  return "citizen";
}

function getRoleBasePath(role: RouteRole): string {
  return role === "citizen" ? "" : `/${role}`;
}

//the changes ends here. The rest of the code is just the default code from the supabase auth middleware example. You can find the original code here:
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

  const user = data?.claims

  const pathname = request.nextUrl.pathname;
  const pathRole = getPathRole(pathname);
  const pathDbRole = routeRoleToDbRole(pathRole);

  if (pathRole === "admin" && process.env.NODE_ENV !== "production") {
    return supabaseResponse;
  }
  // remove this condition if you want to protect the citizen routes as well
  if (isPublicCitizenPath(pathname)) {
    return supabaseResponse;
  }

  /*
  
  const pathArray = pathname.includes('/') && pathname.trim() !== '/' ? pathname.split('/') : [];

  const pathRole = pathArray.indexOf('barangay') > 0 ? 
    'barangay' : 
    pathArray.indexOf('city') > 0 ? 
    'city' : 
    'citizen';
  */
  const userRole = user?.user_metadata?.access?.role;
  const normalizedUserDbRole = normalizeToDbRole(userRole);
  const normalizedUserRouteRole = normalizedUserDbRole
    ? dbRoleToRouteRole(normalizedUserDbRole)
    : null;
  

  if (
    !user && 
    !request.nextUrl.pathname.endsWith('/sign-in') &&
    !request.nextUrl.pathname.endsWith('/sign-up') &&
    !request.nextUrl.pathname.endsWith('/forgot-password') &&
    !request.nextUrl.pathname.endsWith('/update-password') 
  ) {
    const url = request.nextUrl.clone()
    url.pathname = `${getRoleBasePath(pathRole)}/sign-in`
    return NextResponse.redirect(url)
  }

  if (user && !normalizedUserDbRole) {
    const url = request.nextUrl.clone()
    url.pathname = `${getRoleBasePath(pathRole)}/sign-in`
    return NextResponse.redirect(url)
  }
  
  // signed in user accessing different role
  if (user && normalizedUserDbRole && pathDbRole !== normalizedUserDbRole) {
    const url = request.nextUrl.clone()
    const unauthorizedRole = normalizedUserRouteRole ?? pathRole;
    url.pathname = `${getRoleBasePath(unauthorizedRole)}/unauthorized`
    return NextResponse.redirect(url)
  }
  if (
    user && (
      request.nextUrl.pathname.endsWith('/sign-in') ||
      request.nextUrl.pathname.endsWith('/sign-up') ||
      request.nextUrl.pathname.endsWith('/forgot-password')
    )
  ) {
    const url = request.nextUrl.clone()
    const destinationRole = normalizedUserRouteRole ?? pathRole;
    url.pathname = `${getRoleBasePath(destinationRole)}/`
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
