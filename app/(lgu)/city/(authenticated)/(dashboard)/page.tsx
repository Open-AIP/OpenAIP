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

  const { fullName, email, userRole, userLocale, baseURL } = user;

  return (
    <div>
      <p>CityDashboard</p>
      <p>
        Hello {fullName}, {email}. Role: {userRole}{userRole === 'citizen' ? '' : ' official'} from {userLocale}.
      </p>      <LogoutButton role={userRole} baseURL={baseURL}/>
    </div>
  )
}

export default CityDashboard