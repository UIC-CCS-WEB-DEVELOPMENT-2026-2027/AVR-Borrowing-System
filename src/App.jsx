import { useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/context/AuthContext'
import { useAuth } from '@/context/useAuth'
import { BorrowingProvider } from '@/context/BorrowingContext'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import {
  BorrowFormPage,
  ConfirmationPage,
  ScanPage,
} from '@/pages/StudentPages'
import {
  HistoryPage,
  InventoryPage,
  NotificationsPage,
  ReturnPage,
  StaffDashboardPage,
} from '@/pages/StaffPages'
import './App.css'

function ShellPage({ page, children }) {
  const routerNavigate = useNavigate()
  const navigate = (destination) => routerNavigate(`/${destination}`)
  return (
    <AppShell page={page} navigate={navigate}>
      {children}
    </AppShell>
  )
}

function RootRedirect() {
  const { user, isReady } = useAuth()
  if (!isReady) {
    return <div className="auth-loading" role="status">Restoring your secure session...</div>
  }
  return <Navigate to={user ? (user.role === 'student' ? '/home' : '/dashboard') : '/login'} replace />
}

function RoutedApplication() {
  const { user } = useAuth()
  const location = useLocation()
  const routerNavigate = useNavigate()
  const navigate = (destination) => routerNavigate(`/${destination}`)
  const [lastLoanId, setLastLoanId] = useState(null)

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user
            ? <Navigate to={user.role === 'student' ? '/home' : '/dashboard'} replace />
            : <LoginPage onAuthenticated={(authenticatedUser) => {
              const requestedPath = location.state?.from
              const fallback = authenticatedUser.role === 'student' ? '/home' : '/dashboard'
              routerNavigate(requestedPath || fallback, { replace: true })
            }} />
        }
      />
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/home" element={<ShellPage page="home"><HomePage navigate={navigate} /></ShellPage>} />
        <Route path="/scan" element={<ShellPage page="scan"><ScanPage navigate={navigate} /></ShellPage>} />
        <Route path="/borrow" element={<ShellPage page="borrow"><BorrowFormPage navigate={navigate} onBorrowed={setLastLoanId} /></ShellPage>} />
        <Route path="/confirmation" element={<ShellPage page="confirmation"><ConfirmationPage loanId={lastLoanId} navigate={navigate} /></ShellPage>} />
        <Route path="/return" element={<ShellPage page="return"><ReturnPage /></ShellPage>} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} />}>
        <Route path="/dashboard" element={<ShellPage page="dashboard"><StaffDashboardPage navigate={navigate} /></ShellPage>} />
        <Route path="/inventory" element={<ShellPage page="inventory"><InventoryPage /></ShellPage>} />
        <Route path="/notifications" element={<ShellPage page="notifications"><NotificationsPage /></ShellPage>} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['student', 'staff']} />}>
        <Route path="/history" element={<ShellPage page="history"><HistoryPage /></ShellPage>} />
      </Route>
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BorrowingProvider>
        <RoutedApplication />
      </BorrowingProvider>
    </AuthProvider>
  )
}

export default App
