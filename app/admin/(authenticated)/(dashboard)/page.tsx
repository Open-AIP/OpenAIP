import { LogoutButton } from '@/components/logout-button'
import { getUser } from '@/lib/actions/auth.actions'

const AdminDashboard = async () => {

  const {fullName, email, userRole, userLocale, baseURL} = await getUser();

  return (
    <div>
      <p>AdminDashboard</p>
      <p>
        Hello {fullName}, {email}. A {userRole} {userRole === 'citizen' ? '':' official'} from {userLocale}
      </p>
      <LogoutButton role={'admin'} baseURL={baseURL}/>
    </div>
  )
}

export default AdminDashboard