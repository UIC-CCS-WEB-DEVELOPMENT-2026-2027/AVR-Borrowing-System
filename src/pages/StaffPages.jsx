import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  PackageCheck,
  Search,
  ShieldAlert,
  Video,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useBorrowing } from '@/context/useBorrowing'
import { useAuth } from '@/context/useAuth'
import { formatDateTime, formatLongDate, getLoanStatus, getStatusVariant } from '@/pages/pageUtils'

function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="page-title-row">
      <div className="page-title-block">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}

function StatusBadge({ status }) {
  const className =
    status === 'Available' ? 'status-available' :
      status === 'Overdue' || status === 'Maintenance' ? 'status-overdue' :
        status === 'Returned' ? 'status-returned' :
          status === 'Checked out' ? 'status-active' : 'status-neutral'
  return <Badge className={`status-badge ${className}`} variant={getStatusVariant(status)}>{status}</Badge>
}

function SearchField({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="table-search">
      <Search size={16} />
      <Input aria-label={placeholder} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function EmptyTable({ icon: Icon = ClipboardList, title, description }) {
  return <div className="empty-state"><Icon size={25} /><strong>{title}</strong><span>{description}</span></div>
}

export function StaffDashboardPage({ navigate }) {
  const { activeLoans, equipment, returnEquipment } = useBorrowing()
  const overdue = activeLoans.filter((loan) => getLoanStatus(loan) === 'Overdue').length
  const dueToday = activeLoans.filter((loan) => new Date(loan.returnAt).toDateString() === new Date().toDateString()).length
  const availableCount = equipment.filter((item) => item.status === 'available').length

  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="STAFF PORTAL / OVERVIEW"
        title="Good morning, AVR team."
        description="Here's what's happening with your equipment today."
        action={<Button className="primary-action" onClick={() => navigate('inventory')}><PackageCheck size={16} /> Manage inventory</Button>}
      />
      <div className="metrics-grid staff-metrics">
        <Card className="metric-card"><CardContent className="metric-content"><span className="metric-icon icon-blue"><ArrowDownToLine size={18} /></span><span className="metric-label">Active loans</span><strong>{activeLoans.length.toString().padStart(2, '0')}</strong><span className="metric-note">Equipment with students</span></CardContent></Card>
        <Card className="metric-card"><CardContent className="metric-content"><span className="metric-icon icon-green"><PackageCheck size={18} /></span><span className="metric-label">Available items</span><strong>{availableCount.toString().padStart(2, '0')}</strong><span className="metric-note">Ready to check out</span></CardContent></Card>
        <Card className="metric-card"><CardContent className="metric-content"><span className="metric-icon icon-amber"><Clock3 size={18} /></span><span className="metric-label">Due today</span><strong>{dueToday.toString().padStart(2, '0')}</strong><span className="metric-note">Scheduled for return</span></CardContent></Card>
        <Card className="metric-card"><CardContent className="metric-content"><span className="metric-icon icon-red"><AlertTriangle size={18} /></span><span className="metric-label">Overdue</span><strong>{overdue.toString().padStart(2, '0')}</strong><span className="metric-note">Follow-up required</span></CardContent></Card>
      </div>
      {overdue > 0 && (
        <div className="attention-banner"><span className="attention-icon"><ShieldAlert size={18} /></span><div><strong>{overdue} return {overdue === 1 ? 'needs' : 'need'} your attention</strong><p>Review overdue equipment and contact the borrower to arrange a return.</p></div><Button variant="outline" size="sm" onClick={() => navigate('return')}>Review returns <ArrowRight size={14} /></Button></div>
      )}
      <Card className="data-card">
        <div className="data-card-heading">
          <div><span className="eyebrow">EQUIPMENT OUT</span><h2>Current borrowers</h2><p>Track checked-out items and expected return times.</p></div>
          <Button variant="outline" size="sm" onClick={() => navigate('history')}>History <ArrowUpRight size={15} /></Button>
        </div>
        {activeLoans.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Equipment</TableHead><TableHead>Borrower</TableHead><TableHead>Room</TableHead><TableHead>Return by</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {activeLoans.map((loan) => {
                const item = equipment.find((entry) => entry.id === loan.equipmentId)
                const status = getLoanStatus(loan)
                return (
                  <TableRow key={loan.id}>
                    <TableCell><span className="table-primary">{item?.name ?? 'Equipment'}</span><span className="table-secondary">{item?.id}</span></TableCell>
                    <TableCell><span className="table-primary">{loan.studentName}</span><span className="table-secondary">{loan.email}</span></TableCell>
                    <TableCell>{loan.room}</TableCell>
                    <TableCell>{formatDateTime(loan.returnAt)}</TableCell>
                    <TableCell><StatusBadge status={status} /></TableCell>
                    <TableCell><Button variant="outline" size="sm" onClick={() => returnEquipment(loan.id)}>Check in</Button></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : <EmptyTable icon={PackageCheck} title="Everything is checked in" description="New active loans will appear here." />}
        <div className="data-card-footer"><span><span className="live-pulse" /> Live session data</span><button onClick={() => navigate('notifications')}>See notifications <ArrowRight size={14} /></button></div>
      </Card>
      <Card className="staff-shortcuts">
        <CardContent>
          <div><span className="shortcut-icon"><Video size={18} /></span><span><strong>Quick staff actions</strong><small>Keep your equipment desk up to date.</small></span></div>
          <Button variant="outline" onClick={() => navigate('inventory')}>View inventory <ArrowRight size={15} /></Button>
          <Button variant="outline" onClick={() => navigate('return')}>Process a return <ArrowRight size={15} /></Button>
          <Button variant="outline" onClick={() => navigate('notifications')}>Open alerts <Bell size={15} /></Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function NotificationsPage() {
  const { notifications, markNotificationRead } = useBorrowing()
  const unreadCount = notifications.filter((notification) => !notification.read).length
  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.time) - new Date(a.time))

  return (
    <div className="page-stack">
      <PageTitle eyebrow="STAFF PORTAL / ACTIVITY" title="Notifications" description="Borrowing requests, returns, and alerts from the equipment desk." action={unreadCount > 0 && <Badge className="unread-counter" variant="outline">{unreadCount} unread</Badge>} />
      <div className="notification-toolbar"><span><span className="live-pulse" /> Updating in real time during this session</span><span>{notifications.length} total alerts</span></div>
      <div className="notification-list">
        {sortedNotifications.length ? sortedNotifications.map((notification) => {
          const isOverdue = notification.kind === 'overdue'
          const isReturn = notification.kind === 'return'
          const Icon = isOverdue ? AlertTriangle : isReturn ? CheckCircle2 : ArrowDownToLine
          return (
            <Card className={`notification-card ${notification.read ? '' : 'notification-unread'}`} key={notification.id}>
              <CardContent>
                <span className={`notification-icon ${isOverdue ? 'notification-icon-red' : isReturn ? 'notification-icon-green' : 'notification-icon-blue'}`}><Icon size={18} /></span>
                <div className="notification-copy">
                  <div className="notification-title-row"><strong>{notification.title}</strong>{!notification.read && <span className="unread-dot" />}</div>
                  <p>{notification.message}</p>
                  <span className="notification-time"><Clock3 size={13} /> {formatLongDate(notification.time)}</span>
                </div>
                {!notification.read && <Button variant="outline" size="sm" onClick={() => markNotificationRead(notification.id)}><Check size={14} /> Mark read</Button>}
              </CardContent>
            </Card>
          )
        }) : <Card className="data-card"><EmptyTable icon={Bell} title="You're all caught up" description="New staff alerts will appear here as activity happens." /></Card>}
      </div>
    </div>
  )
}

export function InventoryPage() {
  const { equipment, activeLoans } = useBorrowing()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const categories = [...new Set(equipment.map((item) => item.category))]

  const filteredEquipment = useMemo(() => equipment.filter((item) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || `${item.name} ${item.id} ${item.category}`.toLowerCase().includes(query)
    const matchesStatus = status === 'all' || item.status === status
    const matchesCategory = category === 'all' || item.category === category
    return matchesSearch && matchesStatus && matchesCategory
  }), [equipment, search, status, category])

  const statusCounts = {
    all: equipment.length,
    available: equipment.filter((item) => item.status === 'available').length,
    'checked-out': equipment.filter((item) => item.status === 'checked-out').length,
    maintenance: equipment.filter((item) => item.status === 'maintenance').length,
  }

  return (
    <div className="page-stack">
      <PageTitle eyebrow="STAFF PORTAL / EQUIPMENT" title="Equipment inventory" description="A live view of the gear available at the AVR desk." action={<Badge className="inventory-total" variant="outline"><PackageCheck size={14} /> {equipment.length} items</Badge>} />
      <Card className="data-card">
        <div className="inventory-toolbar">
          <Tabs value={status} onValueChange={setStatus} className="inventory-tabs">
            <TabsList>
              <TabsTrigger value="all">All <span>{statusCounts.all}</span></TabsTrigger>
              <TabsTrigger value="available">Available <span>{statusCounts.available}</span></TabsTrigger>
              <TabsTrigger value="checked-out">Checked out <span>{statusCounts['checked-out']}</span></TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance <span>{statusCounts.maintenance}</span></TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="inventory-filters">
            <SearchField value={search} onChange={setSearch} placeholder="Search equipment..." />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="category-select"><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((entry) => <SelectItem value={entry} key={entry}>{entry}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        {filteredEquipment.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Equipment</TableHead><TableHead>Category</TableHead><TableHead>Location</TableHead><TableHead>Borrower</TableHead><TableHead>Status</TableHead><TableHead>Asset ID</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredEquipment.map((item) => {
                const loan = activeLoans.find((entry) => entry.equipmentId === item.id)
                const statusLabel = item.status === 'checked-out' ? 'Checked out' : item.status === 'maintenance' ? 'Maintenance' : 'Available'
                return (
                  <TableRow key={item.id}>
                    <TableCell><span className="equipment-cell"><span className={`equipment-icon equipment-${item.category.toLowerCase()}`}><Video size={17} /></span><span className="table-primary">{item.name}</span></span></TableCell>
                    <TableCell>{item.category}</TableCell><TableCell>{item.location}</TableCell>
                    <TableCell>{loan ? <span className="table-primary">{loan.studentName}</span> : <span className="muted-cell">—</span>}</TableCell>
                    <TableCell><StatusBadge status={statusLabel} /></TableCell><TableCell className="asset-id">{item.id}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : <EmptyTable icon={Search} title="No equipment matches" description="Try a different search term or filter." />}
        <div className="data-card-footer"><span>Showing {filteredEquipment.length} of {equipment.length} items</span><span><span className="live-pulse" /> Inventory updates as items are borrowed or returned</span></div>
      </Card>
      <div className="inventory-note"><ShieldAlert size={16} /><span><strong>Maintenance status:</strong> Items under maintenance are hidden from student borrowing requests until cleared.</span></div>
    </div>
  )
}

export function ReturnPage() {
  const { activeLoans, equipment, returnEquipment } = useBorrowing()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedLoan, setSelectedLoan] = useState(null)
  const query = search.trim().toLowerCase()
  const ownLoans = activeLoans.filter((loan) => loan.email === user.email)
  const filteredLoans = ownLoans.filter((loan) => {
    const item = equipment.find((entry) => entry.id === loan.equipmentId)
    return `${item?.name} ${item?.id} ${loan.studentName} ${loan.email} ${loan.room}`.toLowerCase().includes(query)
  })

  const confirmReturn = () => {
    if (selectedLoan) returnEquipment(selectedLoan.id)
    setSelectedLoan(null)
  }

  return (
    <div className="page-stack">
      <PageTitle eyebrow="STUDENT / CHECK-IN" title="Return equipment" description="Search your active loans, then confirm the item has been checked back in." />
      <Card className="data-card">
        <div className="data-card-heading return-toolbar">
          <div><span className="eyebrow">YOUR ACTIVE LOANS</span><h2>Items currently checked out</h2><p>{ownLoans.length} {ownLoans.length === 1 ? 'item' : 'items'} waiting to be returned</p></div>
          <SearchField value={search} onChange={setSearch} placeholder="Search borrower or item..." />
        </div>
        {filteredLoans.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Equipment</TableHead><TableHead>Borrower</TableHead><TableHead>Room</TableHead><TableHead>Return by</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>{filteredLoans.map((loan) => {
              const item = equipment.find((entry) => entry.id === loan.equipmentId)
              const status = getLoanStatus(loan)
              return <TableRow key={loan.id}><TableCell><span className="table-primary">{item?.name ?? 'Equipment'}</span><span className="table-secondary">{item?.id}</span></TableCell><TableCell><span className="table-primary">{loan.studentName}</span><span className="table-secondary">{loan.email}</span></TableCell><TableCell>{loan.room}</TableCell><TableCell>{formatDateTime(loan.returnAt)}</TableCell><TableCell><StatusBadge status={status} /></TableCell><TableCell><Button size="sm" className="checkin-button" onClick={() => setSelectedLoan(loan)}><Check size={14} /> Check in</Button></TableCell></TableRow>
            })}</TableBody>
          </Table>
        ) : <EmptyTable icon={PackageCheck} title={query ? 'No matching loans found' : 'No items to return'} description={query ? 'Try another item name, borrower, or room.' : 'All equipment is currently checked in.'} />}
        <div className="data-card-footer"><span>Returns immediately update the inventory and transaction history.</span><span><CheckCircle2 size={14} /> Check the item condition before confirming</span></div>
      </Card>
      <Dialog open={Boolean(selectedLoan)} onOpenChange={(open) => { if (!open) setSelectedLoan(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm equipment return</DialogTitle>
            <DialogDescription>Check the item back into the AVR inventory. The borrower record and item availability will update immediately.</DialogDescription>
          </DialogHeader>
          {selectedLoan && <div className="return-confirmation"><span className="confirm-equipment-icon"><Video size={19} /></span><div><strong>{equipment.find((item) => item.id === selectedLoan.equipmentId)?.name}</strong><small>{selectedLoan.studentName} · {selectedLoan.room}</small></div></div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLoan(null)}>Cancel</Button>
            <Button className="primary-action" onClick={confirmReturn}><Check size={15} /> Confirm return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function HistoryPage() {
  const { history } = useBorrowing()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const visibleHistory = user.role === 'staff'
    ? history
    : history.filter((entry) => entry.email === user.email)
  const filteredHistory = useMemo(() => visibleHistory.filter((entry) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || `${entry.equipmentName} ${entry.studentName} ${entry.email} ${entry.loanId} ${entry.room}`.toLowerCase().includes(query)
    const matchesAction = action === 'all' || entry.action.toLowerCase() === action
    const isToday = new Date(entry.timestamp).toDateString() === new Date().toDateString()
    const matchesDate = dateRange === 'all' || (dateRange === 'today' ? isToday : !isToday)
    return matchesSearch && matchesAction && matchesDate
  }), [visibleHistory, search, action, dateRange])

  return (
    <div className="page-stack">
      <PageTitle eyebrow={user.role === 'student' ? 'STUDENT / MY RECORDS' : 'STAFF PORTAL / RECORDS'} title={user.role === 'student' ? 'My borrowing history' : 'Borrowing history'} description={user.role === 'student' ? 'Review your equipment check-outs and returns.' : 'Search and review equipment check-outs and returns recorded this session.'} action={<Badge className="inventory-total" variant="outline"><ClipboardList size={14} /> {visibleHistory.length} transactions</Badge>} />
      <Card className="data-card">
        <div className="history-toolbar">
          <SearchField value={search} onChange={setSearch} placeholder="Search borrower, item, or ID..." />
          <div className="history-filters">
            <Select value={action} onValueChange={setAction}><SelectTrigger className="filter-select"><SelectValue placeholder="All activity" /></SelectTrigger><SelectContent><SelectItem value="all">All activity</SelectItem><SelectItem value="borrowed">Borrowed</SelectItem><SelectItem value="returned">Returned</SelectItem></SelectContent></Select>
            <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger className="filter-select"><SelectValue placeholder="Any time" /></SelectTrigger><SelectContent><SelectItem value="all">Any time</SelectItem><SelectItem value="today">Today</SelectItem><SelectItem value="older">Earlier</SelectItem></SelectContent></Select>
          </div>
        </div>
        {filteredHistory.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Transaction</TableHead><TableHead>Equipment</TableHead><TableHead>Borrower</TableHead><TableHead>Room</TableHead><TableHead>Activity</TableHead><TableHead>Date & time</TableHead></TableRow></TableHeader>
            <TableBody>{filteredHistory.map((entry) => <TableRow key={entry.id}><TableCell><span className="table-primary">{entry.loanId}</span><span className="table-secondary">{entry.id}</span></TableCell><TableCell><span className="table-primary">{entry.equipmentName}</span></TableCell><TableCell><span className="table-primary">{entry.studentName}</span><span className="table-secondary">{entry.email}</span></TableCell><TableCell>{entry.room}</TableCell><TableCell><StatusBadge status={entry.action} /></TableCell><TableCell>{formatDateTime(entry.timestamp)}</TableCell></TableRow>)}</TableBody>
          </Table>
        ) : <EmptyTable icon={Search} title="No transactions match those filters" description="Adjust your search, activity type, or date range." />}
        <div className="data-card-footer"><span>Showing {filteredHistory.length} of {visibleHistory.length} transactions</span><span><ChevronDown size={14} /> Records update when an item is borrowed or returned</span></div>
      </Card>
    </div>
  )
}
