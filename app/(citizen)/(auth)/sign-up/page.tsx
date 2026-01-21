import { SignUpForm } from '@/components/sign-up-form'

export default function Page() {

  const role:string = 'citizen';
  const baseURL = process.env.BASE_URL!;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm role={role} baseURL={baseURL}/>
      </div>
    </div>
  )
}
