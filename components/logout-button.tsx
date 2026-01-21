'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function LogoutButton({role}:AuthParameters) {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${role === 'citizen' ? '' : role}`)
  }

  return <Button onClick={logout}>Logout</Button>
}
