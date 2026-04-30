import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'

interface Admin {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'ORDER_MANAGER' | 'STUDIO_MANAGER'
}

type SupabaseUser = {
  id: string
  email?: string
  user_metadata?: Record<string, any>
}

interface AuthContextType {
  user: SupabaseUser | null
  admin: Admin | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchAdminProfile(session.user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchAdminProfile(session.user)
      } else {
        setAdmin(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchAdminProfile = async (_user: SupabaseUser) => {
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) {
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAdmin(data.data.admin)
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (data.user) {
      await fetchAdminProfile(data.user)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ user, admin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
