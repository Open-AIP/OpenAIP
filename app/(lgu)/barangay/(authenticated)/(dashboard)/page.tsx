import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase/server'
import Placeholder from '@/components/layout/placeholder';

const BarangayDashboard = async () => {

  const role:string = 'barangay';
  const baseURL = process.env.BASE_URL;
  if (!baseURL) {
    throw new Error('BASE_URL environment variable is not set');
  }
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  
  if (error || !data?.claims) {
    redirect(`/${role}/sign-in`)
  }


  return (
    <div>
      <Placeholder title="Barangay Dashboard" description="Welcome to the Barangay Dashboard. 
      This is where you can manage barangay affairs and access important information." />
    </div>
  )
}

export default BarangayDashboard