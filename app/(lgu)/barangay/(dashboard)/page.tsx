import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase/server'

const BarangayDashboard = async () => {

  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  
  if (error || !data?.claims) {
    redirect('/barangay/login')
  }
  
  console.log(data.claims.user_metadata);

  return (
    <div>BarangayDashboard</div>
  )
}

export default BarangayDashboard