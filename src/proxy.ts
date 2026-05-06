import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnAdmin = req.nextUrl.pathname.startsWith('/admin')
  
  if (isOnAdmin) {
    if (!isLoggedIn) return Response.redirect(new URL('/login', req.nextUrl))
    return
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
