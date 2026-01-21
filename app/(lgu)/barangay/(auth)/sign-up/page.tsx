import { SignUpForm } from '@/components/sign-up-form'

export default function Page() {

  const role = 'barangay';
  const baseURL = process.env.BASE_URL;

  if (!baseURL) {
    throw new Error('BASE_URL environment variable is not defined');
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm role={role} baseURL={baseURL} />
      </div>
    </div>
  )
}
