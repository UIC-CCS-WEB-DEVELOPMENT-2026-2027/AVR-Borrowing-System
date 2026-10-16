import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from '@/context/authContextValue'

const SESSION_KEY = 'avr-auth-session'
const ACCOUNTS_KEY = 'avr-auth-accounts'
const DEMO_STAFF = {
  email: 'staff@uic.edu.ph',
  password: 'AVRstaff2026!',
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password)
  const digest = await window.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

function readAccounts() {
  try {
    const value = localStorage.getItem(ACCOUNTS_KEY)
    if (!value) return []
    const accounts = JSON.parse(value)
    if (!Array.isArray(accounts)) {
      throw new Error('Stored account data is not a list.')
    }
    return accounts
  } catch (error) {
    console.error('Unable to read AVR accounts from local storage.', error)
    localStorage.removeItem(ACCOUNTS_KEY)
    return []
  }
}

function readSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return null
    const session = JSON.parse(stored)
    if (
      !session ||
      typeof session.token !== 'string' ||
      !session.user?.email ||
      !['student', 'staff', 'admin'].includes(session.user.role)
    ) {
      throw new Error('Stored AVR session is invalid.')
    }
    return session
  } catch (error) {
    console.error('Unable to restore the AVR session from local storage.', error)
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const seedStaffAccount = async () => {
      const accounts = readAccounts()
      const existingStaff = accounts.find(
        (account) => account.email === DEMO_STAFF.email,
      )
      if (!existingStaff) {
        accounts.push({
          name: 'AVR Staff',
          email: DEMO_STAFF.email,
          role: 'staff',
          passwordHash: await hashPassword(DEMO_STAFF.password),
        })
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
      }
      if (!cancelled) setIsReady(true)
    }
    seedStaffAccount().catch((error) => {
      console.error('Unable to initialize AVR authentication.', error)
      if (!cancelled) setIsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase()
    const passwordHash = await hashPassword(password)
    const account = readAccounts().find(
      (entry) =>
        entry.email === normalizedEmail && entry.passwordHash === passwordHash,
    )
    if (!account) {
      throw new Error('The email or password is incorrect.')
    }
    const nextSession = {
      token: window.crypto.randomUUID(),
      user: {
        name: account.name,
        email: account.email,
        role: account.role,
      },
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    return nextSession.user
  }, [])

  const register = useCallback(async ({ name, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (normalizedEmail === DEMO_STAFF.email) {
      throw new Error('That staff email cannot be registered as a student.')
    }
    const accounts = readAccounts()
    if (accounts.some((account) => account.email === normalizedEmail)) {
      throw new Error('An account with this email already exists. Sign in instead.')
    }
    const account = {
      name: name.trim(),
      email: normalizedEmail,
      role: 'student',
      passwordHash: await hashPassword(password),
    }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]))
    const nextSession = {
      token: window.crypto.randomUUID(),
      user: { name: account.name, email: account.email, role: account.role },
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    return nextSession.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        token: session?.token ?? null,
        isReady,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
