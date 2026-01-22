'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { AuthParameters } from "@/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LGUAccounts, ListOfBarangays } from '@/constants'
// import { time } from 'console'

export function SignUpForm({role, baseURL}:AuthParameters) {
  
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const fullNameRef = useRef('');
  const localeRef = useRef('');
  const passwordRef = useRef('');
  const repeatPasswordRef = useRef('');
  const lguListed = useRef(false);

  const router = useRouter()
  
  const rolePath = `${baseURL}${role ===  'citizen' ? '' : '/' + role}`;

  useEffect(() => {
    if(email.trim() === '') {
      setError(null);
    }
  }, [email])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    const supabase = createClient()

    setIsLoading(true)
    setError(null)

    if (role !== 'citizen' && email.trim() !== '') {

      lguListed.current = false;

      // check if the lgu is on the list
      LGUAccounts.forEach((account) => {
        if(account.email === email && account.role === role) {
          lguListed.current = true;
          fullNameRef.current = account.fullName;
          localeRef.current = account.locale
        }
      });

      if(!lguListed.current) {
        setError('Unregistered Email. Contact Admin.')
        setIsLoading(false)
        return
      }
    }
    
    if (role === 'citizen' && !localeRef.current) {
      setError('Please select your barangay')
      setIsLoading(false)
      return
    }

    if (passwordRef.current !== repeatPasswordRef.current) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: passwordRef.current,
        options: {
          emailRedirectTo: rolePath,
          data: {
            fullName: fullNameRef.current,
            access: {
              role,
              locale: localeRef.current
            }
          }
        },
      })

      if (error) throw error

      // Detect "already exists" without relying on error
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error("Account already exists. Please log in.");
      }

      router.push(`${rolePath}/sign-up-success`)      
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
      
  }

  return (
    <div className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new {`${role === 'citizen' ? role : role + ' official'}`} account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              {role === 'citizen' &&
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Juan B. Dela Cruz"
                      required
                      onChange={(e) => fullNameRef.current = e.target.value}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor='barangay'
                    >Barangay</Label>
                    <Select
                      onValueChange={(e) => localeRef.current = e}
                      name='barangay'
                    >
                      <SelectTrigger id="barangay" className="w-full max-w-64">
                        <SelectValue placeholder="Choose your barangay" />
                      </SelectTrigger>
                      <SelectContent>
                        {ListOfBarangays.map((barangay) => (
                          <SelectItem
                            key={barangay}
                            value={barangay.toLowerCase()}
                          >
                            {barangay}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              }
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={role + `${role === 'citizen' ? '' : '-official'}@email.com`}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  onChange={(e) => passwordRef.current = e.target.value}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  onChange={(e) => repeatPasswordRef.current = e.target.value}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating an account...' : 'Sign up'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href={`${rolePath}/sign-in`} className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
