import { LogoutButton } from '@/components/logout-button'
import { getUser } from '@/lib/actions/auth.actions';
import { redirect } from 'next/navigation';

const CitizenDashboard = async () => {
  let user;
  
  try {
    user = await getUser();
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }
  if (!user) {
    redirect('/login');
  }

  const {fullName, email, userRole, userLocale, baseURL} = await getUser();

  return (
    <div>
      <p>CitizenDashboard</p>
      <p>
        Hello {fullName}, {email}. A {userRole} {userRole === 'citizen' ? '':' official'} from {userLocale}
      </p>
      <LogoutButton role={userRole} baseURL={baseURL}/>
    </div>
  )
}

export default CitizenDashboard