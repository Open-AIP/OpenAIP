'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { AuthParameters } from '@/types'

export function LogoutButton({role}:AuthParameters) {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout failed:', error.message)
      // Optionally show a toast/alert to the user
      return
    }
    router.push(`/${role === 'citizen' ? '' : role}`)
  }

  return <Button onClick={logout}>Logout</Button>
}
