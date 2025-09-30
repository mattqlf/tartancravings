"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateCMUUser } from '@/lib/auth/cmu-validator'
import type { User } from '@supabase/supabase-js'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null

      setUser(currentUser)

      if (currentUser) {
        const authorized = validateCMUUser(currentUser)
        setIsAuthorized(authorized)

        if (!authorized) {
          // User is not from CMU, sign them out and redirect
          await supabase.auth.signOut()
          router.push('/auth/unauthorized')
        }
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null
        setUser(currentUser)

        if (currentUser) {
          const authorized = validateCMUUser(currentUser)
          setIsAuthorized(authorized)

          if (!authorized) {
            await supabase.auth.signOut()
            router.push('/auth/unauthorized')
          }
        } else {
          setIsAuthorized(false)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cmu-red"></div>
        </div>
      )
    )
  }

  if (!user || !isAuthorized) {
    router.push('/auth/signin')
    return null
  }

  return <>{children}</>
}