import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Boxes,
  CalendarClock,
  Camera,
  ClipboardCheck,
  Clock3,
  Plus,
  ScanLine,
  Video,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useBorrowing } from '@/context/useBorrowing'
import { useAuth } from '@/context/useAuth'
import { formatDateTime, getLoanStatus, getStatusVariant } from '@/pages/pageUtils'

const actions = [
  { title: 'Borrow equipment', description: 'Request cameras, audio, and more', icon: ArrowDownToLine, page: 'borrow', color: 'blue' },
  { title: 'Return an item', description: 'Check in your borrowed gear', icon: ClipboardCheck, page: 'return', color: 'green' },
  { title: 'Scan student ID', description: 'Quick access with your ID', icon: ScanLine, page: 'scan', color: 'violet' },
]

export function HomePage({ navigate }) {
  const { equipment, activeLoans, history } = useBorrowing()
  const { user } = useAuth()
  const availableCount = equipment.filter((item) => item.status === 'available').length
  const overdueCount = activeLoans.filter((loan) => getLoanStatus(loan) === 'Overdue').length
  const checkedOutCount = activeLoans.filter((loan) => loan.status === 'checked-out').length
  const reservedCount = activeLoans.filter((loan) => loan.status === 'reserved').length
  const ownLoans = activeLoans.filter((loan) => loan.email === user.email)
  const recentLoans = ownLoans.slice(0, 3)

  return (
    <div className="page-stack">
      <section className="welcome-banner">
        <div className="welcome-copy">
          <span className="eyebrow"><span className="live-pulse" /> AVR EQUIPMENT DESK</span>
          <h1>Good day. Ready to make<br className="desktop-break" /> something great?</h1>
          <p>Everything you need for your next class, presentation, or production.</p>
          <div className="welcome-actions">
            <Button className="primary-action" onClick={() => navigate('borrow')}>
              <Plus size={17} /> Start borrowing
            </Button>
            <Button variant="outline" className="welcome-secondary" onClick={() => navigate('borrow')}>
              Browse equipment <ArrowRight size={16} />
            </Button>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-glow" />
          <div className="art-camera"><Video size={68} strokeWidth={1.2} /></div>
          <span className="art-tag tag-camera"><Camera size={15} /> CAMERA</span>
          <span className="art-tag tag-audio"><AudioLines size={15} /> AUDIO</span>
          <span className="art-tag tag-kit"><Boxes size={15} /> AV KITS</span>
        </div>
      </section>

      <div className="metrics-grid">
        <Card className="metric-card">
          <CardContent className="metric-content">
            <span className="metric-icon icon-blue"><Boxes size={18} /></span>
            <span className="metric-label">Available equipment</span>
            <strong>{availableCount}<small> / {equipment.length}</small></strong>
            <span className="metric-note">Ready to check out</span>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="metric-content">
            <span className="metric-icon icon-violet"><ArrowDownToLine size={18} /></span>
            <span className="metric-label">Active borrowings</span>
            <strong>{checkedOutCount.toString().padStart(2, '0')}</strong>
            <span className="metric-note">{reservedCount} reserved awaiting pickup</span>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="metric-content">
            <span className="metric-icon icon-amber"><CalendarClock size={18} /></span>
            <span className="metric-label">Overdue returns</span>
            <strong>{overdueCount.toString().padStart(2, '0')}</strong>
            <span className="metric-note">{overdueCount ? 'Needs staff attention' : 'All caught up'}</span>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="metric-content">
            <span className="metric-icon icon-green"><ClipboardCheck size={18} /></span>
            <span className="metric-label">Transactions</span>
            <strong>{history.length.toString().padStart(2, '0')}</strong>
            <span className="metric-note">Recorded this session</span>
          </CardContent>
        </Card>
      </div>

      <section className="section-block">
        <div className="section-heading">
          <div><span className="eyebrow">GET STARTED</span><h2>What would you like to do?</h2></div>
          <span className="section-note">Your AV desk, made easy</span>
        </div>
        <div className="action-grid">
          {actions.map(({ title, description, icon: Icon, page, color }) => (
            <button className="action-card" key={title} onClick={() => navigate(page)}>
              <span className={`action-icon icon-${color}`}><Icon size={20} /></span>
              <span className="action-copy"><strong>{title}</strong><small>{description}</small></span>
              <ArrowUpRight size={17} className="action-arrow" />
            </button>
          ))}
        </div>
      </section>

      <Card className="data-card">
        <div className="data-card-heading">
          <div><span className="eyebrow">LIVE OVERVIEW</span><h2>Your active borrowings</h2></div>
          <Button variant="outline" size="sm" onClick={() => navigate('return')}>View all <ArrowRight size={15} /></Button>
        </div>
        {recentLoans.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Equipment</TableHead><TableHead>Borrower</TableHead><TableHead>Return time</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {recentLoans.map((loan) => {
                const item = equipment.find((entry) => entry.id === loan.equipmentId)
                const status = getLoanStatus(loan)
                return (
                  <TableRow key={loan.id}>
                    <TableCell><span className="table-primary">{item?.name ?? 'Equipment'}</span><span className="table-secondary">{item?.id}</span></TableCell>
                    <TableCell><span className="borrower-cell"><span className="avatar small">{loan.studentName[0]}</span><span>{loan.studentName}</span></span></TableCell>
                    <TableCell>{formatDateTime(loan.returnAt)}</TableCell>
                    <TableCell><Badge className={`status-badge ${status === 'Overdue' ? 'status-overdue' : status === 'Reserved' ? 'status-neutral' : 'status-active'}`} variant={getStatusVariant(status)}>{status}</Badge></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="empty-state"><ClipboardCheck size={25} /><strong>You have no active borrowings</strong><span>Your active equipment loans will appear here.</span></div>
        )}
        <div className="data-card-footer"><Clock3 size={14} /> Updated just now <button onClick={() => navigate('history')}>See borrowing history <ArrowRight size={14} /></button></div>
      </Card>
    </div>
  )
}
