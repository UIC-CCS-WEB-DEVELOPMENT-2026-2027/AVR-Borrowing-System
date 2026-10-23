import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  QrCode,
  ScanLine,
  ShieldCheck,
  Video,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBorrowing } from '@/context/useBorrowing'
import { useAuth } from '@/context/useAuth'
import { useParams } from 'react-router-dom'
import {
  DESK_CLOSE_HOUR,
  DESK_OPEN_HOUR,
  MAX_LOAN_HOURS,
  MIN_LEAD_MINUTES,
} from '@/lib/borrowRules'
import { formatLongDate } from '@/pages/pageUtils'

function PageTitle({ eyebrow, title, description }) {
  return (
    <div className="page-title-block">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}

function StepIndicator({ current }) {
  const steps = ['Your details', 'Scan ID', 'Choose equipment']
  return (
    <div className="steps-indicator">
      {steps.map((step, index) => (
        <div className={`step-item ${index <= current ? 'step-done' : ''}`} key={step}>
          <span className="step-number">{index < current ? <Check size={13} /> : index + 1}</span>
          <span>{step}</span>
          {index < steps.length - 1 && <span className={`step-line ${index < current ? 'complete' : ''}`} />}
        </div>
      ))}
    </div>
  )
}

export function ScanPage({ navigate }) {
  const { studentEmail, studentId, setStudentId } = useBorrowing()
  const { user } = useAuth()
  const [error, setError] = useState('')
  const canContinue = Boolean(studentEmail || studentId.trim())

  const continueToBorrow = () => {
    if (!canContinue && !studentId.trim()) {
      setError('Enter your school email or student ID to continue.')
      return
    }
    if (studentId.trim()) setStudentId(studentId.trim())
    navigate('borrow')
  }

  return (
    <div className="student-page scan-page">
      <div className="student-flow">
        <StepIndicator current={1} />
        <PageTitle
          eyebrow="STUDENT CHECK-IN"
          title="Verify your student ID."
          description="Scan your ID barcode, or enter your details manually below."
        />
        <Card className="scan-card">
          <CardContent>
            <div className="camera-preview">
              <div className="camera-grid" />
              <div className="camera-frame"><span /><span /><span /><span /><ScanLine size={36} /></div>
              <div className="camera-label"><span className="live-pulse" /> CAMERA PREVIEW</div>
              <div className="camera-status">Camera preview placeholder</div>
            </div>
            <div className="camera-helper"><span className="helper-icon"><QrCode size={17} /></span><span><strong>Point your ID barcode at the frame</strong><small>For this demo, use the manual entry option below.</small></span></div>
            <div className="form-divider"><span>OR ENTER MANUALLY</span></div>
            <label className="field-label" htmlFor="student-id">Student ID or school email</label>
            <Input id="student-id" placeholder={studentEmail || 'e.g. 2026-01234'} value={studentId} onChange={(event) => { setStudentId(event.target.value); setError('') }} onKeyDown={(event) => { if (event.key === 'Enter') continueToBorrow() }} />
            {error && <p className="form-error">{error}</p>}
            <div className="scan-card-actions">
              <Button variant="outline" onClick={() => navigate('home')}><ArrowLeft size={15} /> Back</Button>
              <Button className="primary-action" onClick={continueToBorrow} disabled={!canContinue}>Continue <ArrowRight size={16} /></Button>
            </div>
            {user?.email && <p className="verified-email"><CheckCircle2 size={14} /> Signed in as {user.email}</p>}
          </CardContent>
        </Card>
        <button className="text-back" onClick={() => navigate('home')}><ArrowLeft size={15} /> Back to home</button>
      </div>
    </div>
  )
}

function toLocalDateTime(value) {
  const date = new Date(value)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function BorrowFormPage({ navigate }) {
  const { equipment, setStudentEmail, borrowEquipment } = useBorrowing()
  const { user } = useAuth()
  const availableItems = equipment.filter((item) => item.status === 'available')
  const email = user.email
  const [equipmentId, setEquipmentId] = useState(availableItems[0]?.id ?? '')
  const [returnAt, setReturnAt] = useState(() => toLocalDateTime(Date.now() + 2 * 60 * 60 * 1000))
  const [minimumReturnAt] = useState(() => toLocalDateTime(Date.now() + MIN_LEAD_MINUTES * 60 * 1000))
  const [maximumReturnAt] = useState(() => toLocalDateTime(Date.now() + MAX_LOAN_HOURS * 60 * 60 * 1000))
  const [room, setRoom] = useState('')
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    const result = borrowEquipment({ email: user.email, name: user.name, equipmentId, returnAt, room: room.trim() })
    if (result.error) {
      setError(result.error)
      return
    }
    setStudentEmail(user.email)
    navigate(`confirmation/${result.loanId}`)
  }

  return (
    <div className="page-stack narrow-page">
      <StepIndicator current={2} />
      <PageTitle eyebrow="NEW BORROWING REQUEST" title="What do you need?" description="Tell us what you're borrowing and when you'll bring it back." />
      <div className="borrow-layout">
        <Card className="form-card">
          <CardHeader><CardTitle>Request details</CardTitle><p>Fields marked with * are required.</p></CardHeader>
          <CardContent>
            <form className="stacked-form" onSubmit={submit}>
              <div className="form-field">
                <label className="field-label" htmlFor="borrow-email">Student email <span>*</span></label>
                <div className="input-with-icon"><Mail size={16} /><Input id="borrow-email" type="email" value={email} readOnly /></div>
              </div>
              <div className="form-field">
                <label className="field-label">Equipment <span>*</span></label>
                <Select value={equipmentId} onValueChange={setEquipmentId} required>
                  <SelectTrigger className="full-select"><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>
                    {availableItems.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {!availableItems.length && <span className="field-hint">No equipment is currently available to borrow.</span>}
              </div>
              <div className="form-field">
                <label className="field-label" htmlFor="return-time">Expected return time <span>*</span></label>
                <div className="input-with-icon"><CalendarDays size={16} /><Input id="return-time" type="datetime-local" required min={minimumReturnAt} max={maximumReturnAt} value={returnAt} onChange={(event) => setReturnAt(event.target.value)} /></div>
                <span className="field-hint">Please return equipment to the AVR desk by this time.</span>
                <span className="field-hint">Return times must be between {DESK_OPEN_HOUR % 12 || 12}:00 {DESK_OPEN_HOUR < 12 ? 'AM' : 'PM'} and {DESK_CLOSE_HOUR % 12 || 12}:00 {DESK_CLOSE_HOUR < 12 ? 'AM' : 'PM'}.</span>
              </div>
              <div className="form-field">
                <label className="field-label" htmlFor="borrow-room">Room / event location <span>*</span></label>
                <div className="input-with-icon"><MapPin size={16} /><Input id="borrow-room" placeholder="e.g. AVR 302" required value={room} onChange={(event) => setRoom(event.target.value)} /></div>
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="form-actions">
                <Button type="button" variant="outline" onClick={() => navigate('home')}>Cancel</Button>
                <Button type="submit" className="primary-action" disabled={!availableItems.length || !equipmentId}>Confirm borrowing <ArrowRight size={16} /></Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="borrow-tip-card">
          <CardContent>
            <span className="tip-icon"><ShieldCheck size={19} /></span>
            <h3>Before you borrow</h3>
            <ul>
              <li><span>01</span> Check your return time with your instructor.</li>
              <li><span>02</span> Keep all accessories together with the gear.</li>
              <li><span>03</span> Return the equipment to the AVR desk in person.</li>
            </ul>
            <div className="tip-divider" />
            <span className="tip-contact"><Clock3 size={15} /> AVR desk hours <strong>8:00 AM – 5:00 PM</strong></span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function readStoredConfirmation(loanId) {
  try {
    const stored = window.sessionStorage.getItem(`avr-confirmation-${loanId}`)
    if (!stored) return null
    const confirmation = JSON.parse(stored)
    const { loan, equipment } = confirmation ?? {}
    if (
      !loan ||
      loan.id !== loanId ||
      typeof loan.email !== 'string' ||
      typeof loan.studentName !== 'string' ||
      typeof loan.equipmentId !== 'string' ||
      typeof loan.returnAt !== 'string' ||
      !equipment ||
      equipment.id !== loan.equipmentId ||
      typeof equipment.name !== 'string'
    ) {
      throw new Error('Stored AVR confirmation is invalid.')
    }
    return confirmation
  } catch (error) {
    console.error('Unable to read the AVR confirmation from session storage.', error)
    return null
  }
}

export function ConfirmationPage({ navigate }) {
  const { loanId } = useParams()
  const { activeLoans, equipment } = useBorrowing()
  const { user } = useAuth()
  const activeLoan = activeLoans.find((entry) => entry.id === loanId)
  const storedConfirmation = activeLoan ? null : readStoredConfirmation(loanId)
  const loan = activeLoan ?? storedConfirmation?.loan
  const authorized = loan && (user.role !== 'student' || loan.email === user.email)
  const item = equipment.find((entry) => entry.id === loan?.equipmentId) ?? storedConfirmation?.equipment

  if (!authorized) {
    return (
      <div className="page-stack">
        <PageTitle eyebrow="BORROWING REQUEST" title="No recent request found." description="Start a borrowing request to see its confirmation here." />
        <Button className="primary-action" onClick={() => navigate('borrow')}>Start a request <ArrowRight size={16} /></Button>
      </div>
    )
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-heading">
        <span className="success-emblem"><Check size={25} /></span>
        <Badge className="confirmation-badge" variant="secondary">REQUEST CONFIRMED</Badge>
        <h1>You're all set, {loan.studentName.split(' ')[0]}.</h1>
        <p>Your borrowing request is confirmed. Show this code at the AVR desk when collecting your equipment.</p>
      </div>
      <Card className="confirmation-card">
        <div className="confirmation-summary">
          <div className="confirmation-equipment-icon"><Video size={25} /></div>
          <div className="confirmation-equipment"><span>EQUIPMENT RESERVED</span><h2>{item?.name ?? 'Equipment'}</h2><small>{item?.id} <i /> AVR Media Center</small></div>
          <Badge className={`status-badge ${loan.status === 'reserved' ? 'status-neutral' : 'status-active'}`} variant="outline">
            {loan.status === 'reserved' ? 'Reserved: show this code at the desk' : 'Checked out'}
          </Badge>
        </div>
        <div className="confirmation-details">
          <div><span>Borrower</span><strong>{loan.studentName}</strong><small>{loan.email}</small></div>
          <div><span>Room / location</span><strong>{loan.room}</strong></div>
          <div><span>Return by</span><strong>{formatLongDate(loan.returnAt)}</strong></div>
        </div>
        <div className="confirmation-code-section">
          <div className="code-copy"><span>YOUR PICKUP CODE</span><strong>{loan.id}</strong><small>Present this code to the AVR staff member.</small></div>
          <div className="qr-frame"><QRCodeSVG value={loan.id} size={180} level="M" marginSize={2} /><span>SCAN AT THE AVR DESK</span></div>
        </div>
      </Card>
      <div className="confirmation-footer-actions">
        <Button variant="outline" onClick={() => navigate('home')}><ArrowLeft size={15} /> Back to home</Button>
        <Button className="primary-action" onClick={() => navigate('return')}>View my borrowing <ChevronRight size={16} /></Button>
      </div>
    </div>
  )
}
