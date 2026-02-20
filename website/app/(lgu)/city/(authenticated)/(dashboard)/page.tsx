import { LogoutButton } from '@/components/logout-button'
import { getUser } from '@/lib/actions/auth.actions';
import { redirect } from 'next/navigation';

const CityDashboard = async () => {
  const user = await getUser().catch(() => {
    redirect('/city/sign-in');
  });

  if (!user) {
    redirect('/city/sign-in');
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
