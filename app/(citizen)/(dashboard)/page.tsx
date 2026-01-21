import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase/server'

const CitizenDashboard = async () => {

  const role:string = 'citizen';
  const baseURL = process.env.BASE_URL;
  if (!baseURL) {
    throw new Error('BASE_URL environment variable is not set');
  }
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  
  if (error || !data?.claims) {
    redirect('/sign-in')
  }

  console.log(data.claims.user_metadata);

  return (
    <div>
      <p>CitizenDashboard</p>
      <p>
        Hello <span>{data.claims.email}</span>
      </p>
      <LogoutButton role={role} baseURL={baseURL}/>
    </div>
  )
}

export default CitizenDashboard