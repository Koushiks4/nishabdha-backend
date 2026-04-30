import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function AuthDebug() {
  const { user, admin, loading } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      setSessionInfo({
        hasSession: !!data.session,
        hasToken: !!data.session?.access_token,
        tokenPreview: data.session?.access_token?.substring(0, 30) + '...',
        error: error?.message,
        user: data.session?.user?.email,
      })
    }
    checkSession()
  }, [user])

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg max-w-md text-xs font-mono z-50">
      <h3 className="font-bold text-sm mb-2 text-gray-900">Auth Debug Info</h3>

      <div className="space-y-1 text-gray-700">
        <div>
          <strong>Loading:</strong> {loading ? '🔄 Yes' : '✅ No'}
        </div>
        <div>
          <strong>Supabase User:</strong> {user ? `✅ ${user.email || user.id}` : '❌ No user'}
        </div>
        <div>
          <strong>Admin Profile:</strong> {admin ? `✅ ${admin.email} (${admin.role})` : '❌ No admin'}
        </div>
        <div>
          <strong>Session Exists:</strong> {sessionInfo?.hasSession ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>Token Exists:</strong> {sessionInfo?.hasToken ? '✅ Yes' : '❌ No'}
        </div>
        {sessionInfo?.tokenPreview && (
          <div className="break-all">
            <strong>Token Preview:</strong> <code>{sessionInfo.tokenPreview}</code>
          </div>
        )}
        {sessionInfo?.error && (
          <div className="text-red-600">
            <strong>Error:</strong> {sessionInfo.error}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          console.log('Full Auth State:', { user, admin, loading, sessionInfo })
        }}
        className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
      >
        Log Full State
      </button>
    </div>
  )
}
