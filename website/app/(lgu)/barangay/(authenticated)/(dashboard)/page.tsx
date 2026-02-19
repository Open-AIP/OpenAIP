import { LogoutButton } from '@/components/logout-button'
import { getUser } from '@/lib/actions/auth.actions'

const BarangayDashboard = async () => {

  const { fullName, email, role, routeRole, officeLabel, baseURL } = await getUser();

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
