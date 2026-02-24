import { ForgotPasswordForm } from '@/components/forgot-password-form'

export default function Page() {

  const role = 'admin';
  const baseURL = process.env.BASE_URL;
  if (!baseURL) {
    throw new Error('BASE_URL environment variable is not configured');
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm role={role} baseURL={baseURL}/>
      </div>
    </div>
  )
}
