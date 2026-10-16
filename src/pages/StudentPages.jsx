import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Barcode,
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
  const { studentEmail, setStudentEmail } = useBorrowing()
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState('')
  const canContinue = Boolean(studentEmail || studentId.trim())

  const continueToBorrow = () => {
    if (!canContinue && !studentId.trim()) {
      setError('Enter your school email or student ID to continue.')
      return
    }
    if (studentId.trim()) setStudentEmail(studentId.trim())
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
            {studentEmail && <p className="verified-email"><CheckCircle2 size={14} /> Signed in as {studentEmail}</p>}
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

export function BorrowFormPage({ navigate, onBorrowed }) {
  const { equipment, setStudentEmail, borrowEquipment } = useBorrowing()
  const { user } = useAuth()
  const availableItems = equipment.filter((item) => item.status === 'available')
  const email = user.email
  const [equipmentId, setEquipmentId] = useState(availableItems[0]?.id ?? '')
  const [returnAt, setReturnAt] = useState(() => toLocalDateTime(Date.now() + 2 * 60 * 60 * 1000))
  const [minimumReturnAt] = useState(() => toLocalDateTime(Date.now()))
  const [room, setRoom] = useState('')
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    const result = borrowEquipment({ email: user.email, equipmentId, returnAt, room: room.trim() })
    if (result.error) {
      setError(result.error)
      return
    }
    setStudentEmail(user.email)
    onBorrowed(result.loanId)
    navigate('confirmation')
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
                <div className="input-with-icon"><CalendarDays size={16} /><Input id="return-time" type="datetime-local" required min={minimumReturnAt} value={returnAt} onChange={(event) => setReturnAt(event.target.value)} /></div>
                <span className="field-hint">Please return equipment to the AVR desk by this time.</span>
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

function QRCodeGraphic({ value }) {
  const cells = useMemo(() => {
    const size = 25
    const hash = [...value].reduce((total, char) => total + char.charCodeAt(0), 0)
    return Array.from({ length: size * size }, (_, index) => {
      const row = Math.floor(index / size)
      const col = index % size
      const inFinder = (r, c, top, left) => {
        const dr = r - top
        const dc = c - left
        return dr >= 0 && dr < 7 && dc >= 0 && dc < 7
          ? dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)
          : null
      }
      const finder = inFinder(row, col, 0, 0) ?? inFinder(row, col, 0, 18) ?? inFinder(row, col, 18, 0)
      return finder ?? ((row * 7 + col * 11 + hash + row * col) % 5 < 2)
    })
  }, [value])

  return (
    <svg className="qr-graphic" viewBox="0 0 25 25" role="img" aria-label="Simulated QR code for this borrowing request">
      <rect width="25" height="25" fill="white" />
      {cells.map((active, index) => active && <rect key={index} x={index % 25} y={Math.floor(index / 25)} width="1" height="1" fill="#14221e" />)}
    </svg>
  )
}

export function ConfirmationPage({ loanId, navigate }) {
  const { activeLoans, equipment } = useBorrowing()
  const loan = activeLoans.find((entry) => entry.id === loanId)
  const item = equipment.find((entry) => entry.id === loan?.equipmentId)

  if (!loan) {
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
          <Badge className="status-badge status-active" variant="outline">Ready for pickup</Badge>
        </div>
        <div className="confirmation-details">
          <div><span>Borrower</span><strong>{loan.studentName}</strong><small>{loan.email}</small></div>
          <div><span>Room / location</span><strong>{loan.room}</strong></div>
          <div><span>Return by</span><strong>{formatLongDate(loan.returnAt)}</strong></div>
        </div>
        <div className="confirmation-code-section">
          <div className="code-copy"><span>YOUR PICKUP CODE</span><strong>{loan.id}</strong><small>Present this code to the AVR staff member.</small><div className="code-payload"><Barcode size={14} /> {JSON.stringify({ id: loan.id, item: item?.id, email: loan.email })}</div></div>
          <div className="qr-frame"><QRCodeGraphic value={`${loan.id}:${item?.id}:${loan.email}`} /><span>SIMULATED QR</span></div>
        </div>
      </Card>
      <div className="confirmation-footer-actions">
        <Button variant="outline" onClick={() => navigate('home')}><ArrowLeft size={15} /> Back to home</Button>
        <Button className="primary-action" onClick={() => navigate('return')}>View my borrowing <ChevronRight size={16} /></Button>
      </div>
    </div>
  )
}
