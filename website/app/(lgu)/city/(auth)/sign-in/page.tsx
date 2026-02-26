import { LoginForm } from '@/components/login-form'

export default function Page() {

  const role:string = 'city';
  const baseURL = process.env.BASE_URL;
  if (!baseURL) {
    throw new Error('BASE_URL environment variable is not configured');
  }

  return (
    <LoginForm role={role} baseURL={baseURL}/>
  )
}
