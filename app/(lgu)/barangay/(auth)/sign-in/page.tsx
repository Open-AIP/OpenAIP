import { LoginForm } from '@/components/login-form'

export default function Page() {

  const role = 'barangay' as const;
  const baseURL = process.env.BASE_URL;
  if (!baseURL) {
    throw new Error('BASE_URL environment variable is not configured');
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm role={role} baseURL={baseURL}/>
      </div>
    </div>
  )
}
