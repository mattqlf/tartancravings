import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if the user's email is from CMU domain
      const email = data.user.email
      if (!email || !email.endsWith('@andrew.cmu.edu')) {
        // Sign out the user if they're not from CMU
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/auth/unauthorized`)
      }

      // Successful CMU authentication - redirect to restaurants page
      const redirectPath = next && next.startsWith('/') ? next : '/restaurants'
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  // Authentication failed - redirect to error page
  return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`)
}
