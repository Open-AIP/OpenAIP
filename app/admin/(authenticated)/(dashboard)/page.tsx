import { LogoutButton } from '@/components/logout-button'
import { getUser } from '@/lib/actions/auth.actions'

const AdminDashboard = async () => {

  const { fullName, email, role, officeLabel, baseURL } = await getUser();

  return (
    <div>
      <p>AdminDashboard</p>
      <p>
        Hello {fullName}, {email}. A {role} from {officeLabel}
      </p>
      <LogoutButton role={'admin'} baseURL={baseURL}/>
    </div>
  )
}

export default AdminDashboard
