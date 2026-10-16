import { useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/useAuth'

export function LoginPage({ onAuthenticated }) {
  const { login, register, isReady } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isRegistering = mode === 'register'

  const selectMode = (nextMode) => {
    setMode(nextMode)
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    if (isRegistering && password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const user = isRegistering
        ? await register({ name, email, password })
        : await login(email, password)
      onAuthenticated(user)
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to authenticate. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card-wrap">
        <button className="auth-brand" type="button" aria-label="AVR Borrowing System">
          <span className="brand-mark"><Video size={19} strokeWidth={2.4} /></span>
          <span><strong>AVR<span>+</span></strong><small>Equipment desk</small></span>
        </button>
        <Card className="auth-card">
          <CardHeader className="auth-heading">
            <span className="auth-icon"><ShieldCheck size={20} /></span>
            <span className="eyebrow">UIC MEDIA CENTER</span>
            <CardTitle>{isRegistering ? 'Create your student account' : 'Welcome back'}</CardTitle>
            <p>{isRegistering ? 'Register with your school email to request equipment.' : 'Sign in to borrow equipment or manage the AVR desk.'}</p>
          </CardHeader>
          <CardContent>
            <div className="auth-mode-switch" role="tablist" aria-label="Authentication">
              <button type="button" role="tab" aria-selected={!isRegistering} className={!isRegistering ? 'selected' : ''} onClick={() => selectMode('login')}>Sign in</button>
              <button type="button" role="tab" aria-selected={isRegistering} className={isRegistering ? 'selected' : ''} onClick={() => selectMode('register')}>Create account</button>
            </div>
            <form className="auth-form" onSubmit={submit}>
              {isRegistering && (
                <div>
                  <label className="field-label" htmlFor="auth-name">Full name</label>
                  <Input id="auth-name" autoComplete="name" placeholder="Your name" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} />
                </div>
              )}
              <div>
                <label className="field-label" htmlFor="auth-email">School email</label>
                <div className="input-with-icon"><Mail size={16} /><Input id="auth-email" type="email" autoComplete="email" placeholder="you@uic.edu.ph" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              </div>
              <div>
                <label className="field-label" htmlFor="auth-password">Password</label>
                <div className="input-with-icon password-field">
                  <LockKeyhole size={15} />
                  <Input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={isRegistering ? 'new-password' : 'current-password'} placeholder={isRegistering ? 'At least 8 characters' : 'Enter your password'} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
                  <button type="button" className="password-visibility" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
              </div>
              {isRegistering && (
                <div>
                  <label className="field-label" htmlFor="auth-confirm-password">Confirm password</label>
                  <div className="input-with-icon"><LockKeyhole size={15} /><Input id="auth-confirm-password" type="password" autoComplete="new-password" placeholder="Re-enter your password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
                </div>
              )}
              {error && <p className="form-error auth-error" role="alert">{error}</p>}
              <Button type="submit" className="primary-action auth-submit" disabled={!isReady || isSubmitting}>
                {isSubmitting ? 'Please wait...' : isRegistering ? 'Create student account' : 'Sign in securely'}
                {!isSubmitting && <ArrowRight size={16} />}
              </Button>
            </form>
            <div className="auth-secure-note"><CheckCircle2 size={14} /> Your account is used to manage your equipment transactions.</div>
            <div className="auth-demo">
              <span className="demo-icon"><BadgeCheck size={16} /></span>
              <span><strong>Staff demo account</strong><small>staff@uic.edu.ph <i /> AVRstaff2026!</small></span>
            </div>
            <p className="auth-disclaimer">Demo authentication for this frontend only. Use a server-backed identity provider before production.</p>
          </CardContent>
        </Card>
        <span className="auth-footer">University of the Immaculate Conception <i /> AVR Equipment Desk</span>
      </div>
      <aside className="auth-art">
        <div className="auth-art-glow" />
        <div className="auth-art-orbit auth-art-orbit-one" />
        <div className="auth-art-orbit auth-art-orbit-two" />
        <div className="auth-art-camera"><Video size={70} strokeWidth={1.25} /></div>
        <span className="auth-art-tag auth-art-tag-one"><BadgeCheck size={15} /> CHECKED & READY</span>
        <span className="auth-art-tag auth-art-tag-two"><LockKeyhole size={14} /> STUDENT ACCESS</span>
        <div className="auth-art-copy">
          <span className="eyebrow"><span className="live-pulse" /> THE AVR EQUIPMENT DESK</span>
          <h1>Make room for<br />what you'll create.</h1>
          <p>Find, borrow, and return the tools that bring your next idea to life.</p>
        </div>
      </aside>
    </main>
  )
}
