import { LogoutButton } from '@/components/logout-button'
import { getUser } from '@/lib/actions/auth.actions'
import { redirect } from 'next/navigation'

const BarangayDashboard = async () => {
  const user = await getUser().catch(() => {
    redirect('/barangay/sign-in');
  });

  if (!user) {
    redirect('/barangay/sign-in');
  }

  const { fullName, email, role, routeRole, officeLabel, baseURL } = user;

  return (
    <div>
      <p>BarangayDashboard</p>
      <p>
        Hello {fullName}, {email}. A {role} from {officeLabel}
      </p>
      <LogoutButton role={routeRole} baseURL={baseURL}/>
    </div>
  )
}

export default BarangayDashboard
