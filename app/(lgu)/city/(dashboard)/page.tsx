import { LogoutButton } from '@/components/logout-button'
import { getUser } from '@/lib/actions/auth.actions';

const CityDashboard = async () => {

  const {fullName, email, userRole, userLocale, baseURL} = await getUser();

  return (
    <div>
      <p>CityDashboard</p>
      <p>
        Hello {fullName}, {email}. A {userRole} {userRole === 'citizen' ? '':' official'} from {userLocale}
      </p>
      <LogoutButton role={userRole} baseURL={baseURL}/>
    </div>
  )
}

export default CityDashboard