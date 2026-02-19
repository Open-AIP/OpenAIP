import { LogoutButton } from '@/components/logout-button'
import { getUser } from '@/lib/actions/auth.actions';
import { redirect } from 'next/navigation';

const CityDashboard = async () => {
  let user;
  
  try {
    user = await getUser();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    redirect('/login');
  }
  if (!user) {
    redirect('/login');
  }

  const { fullName, email, role, routeRole, officeLabel, baseURL } = user;

  return (
    <div>
      <p>CityDashboard</p>
      <p>
        Hello {fullName}, {email}. Role: {role} from {officeLabel}.
      </p>
      <LogoutButton role={routeRole} baseURL={baseURL}/>
    </div>
  )
}

export default CityDashboard
