import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function Home() {
  const cookieStore = cookies()
  const token = cookieStore.get('soma-token')

  if (token) {
    redirect('/app/dashboard')
  }

  redirect('/login')
}
