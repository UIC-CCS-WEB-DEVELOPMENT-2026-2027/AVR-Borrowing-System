import { useCallback, useEffect, useMemo, useState } from 'react'
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
  Plus,
  Search,
  ShieldAlert,
  Video,
} from 'lucide-react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
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
          status === 'Reserved' ? 'status-neutral' :
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
  const { activeLoans, equipment, history, returnEquipment } = useBorrowing()
  const [selectedLoan, setSelectedLoan] = useState(null)
  const checkedOutLoans = activeLoans.filter((loan) => loan.status === 'checked-out')
  const reservedCount = activeLoans.filter((loan) => loan.status === 'reserved').length
  const overdue = checkedOutLoans.filter((loan) => getLoanStatus(loan) === 'Overdue').length
  const dueToday = checkedOutLoans.filter((loan) => new Date(loan.returnAt).toDateString() === new Date().toDateString()).length
  const availableCount = equipment.filter((item) => item.status === 'available').length
  const mostBorrowedItems = useMemo(() => {
    const completedLoans = new Map()
    history.forEach((entry) => {
      if (['borrowed', 'picked up'].includes(entry.action.toLowerCase())) {
        completedLoans.set(entry.loanId, entry.equipmentName)
      }
    })
    const counts = new Map()
    completedLoans.forEach((equipmentName) => {
      counts.set(equipmentName, (counts.get(equipmentName) ?? 0) + 1)
    })
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name))
      .slice(0, 3)
  }, [history])
  const confirmReturn = ({ condition, notes }) => {
    if (selectedLoan) returnEquipment(selectedLoan.id, { condition, notes })
    setSelectedLoan(null)
  }

  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="STAFF PORTAL / OVERVIEW"
        title="Good morning, AVR team."
        description="Here's what's happening with your equipment today."
        action={<Button className="primary-action" onClick={() => navigate('inventory')}><PackageCheck size={16} /> Manage inventory</Button>}
      />
      <div className="metrics-grid staff-metrics">
        <Card className="metric-card"><CardContent className="metric-content"><span className="metric-icon icon-blue"><ArrowDownToLine size={18} /></span><span className="metric-label">Active loans</span><strong>{checkedOutLoans.length.toString().padStart(2, '0')}</strong><span className="metric-note">{reservedCount} reserved awaiting pickup</span></CardContent></Card>
        <Card className="metric-card"><CardContent className="metric-content"><span className="metric-icon icon-green"><PackageCheck size={18} /></span><span className="metric-label">Available items</span><strong>{availableCount.toString().padStart(2, '0')}</strong><span className="metric-note">Ready to check out</span></CardContent></Card>
        <Card className="metric-card"><CardContent className="metric-content"><span className="metric-icon icon-amber"><Clock3 size={18} /></span><span className="metric-label">Due today</span><strong>{dueToday.toString().padStart(2, '0')}</strong><span className="metric-note">Scheduled for return</span></CardContent></Card>
        <Card className="metric-card"><CardContent className="metric-content"><span className="metric-icon icon-red"><AlertTriangle size={18} /></span><span className="metric-label">Overdue</span><strong>{overdue.toString().padStart(2, '0')}</strong><span className="metric-note">Follow-up required</span></CardContent></Card>
      </div>
      <Card className="data-card">
        <div className="data-card-heading"><div><span className="eyebrow">USAGE</span><h2>Most borrowed items</h2><p>Ranked by distinct completed loan requests in the history.</p></div></div>
        {mostBorrowedItems.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Equipment</TableHead><TableHead>Completed loans</TableHead></TableRow></TableHeader>
            <TableBody>{mostBorrowedItems.map((item) => (
              <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell>{item.count}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        ) : <EmptyTable icon={PackageCheck} title="No completed borrowing history" description="Borrowed items will appear here after pickup." />}
        <div className="data-card-footer"><span>Overdue loans right now</span><strong>{overdue}</strong></div>
      </Card>
      {overdue > 0 && (
        <div className="attention-banner"><span className="attention-icon"><ShieldAlert size={18} /></span><div><strong>{overdue} return {overdue === 1 ? 'needs' : 'need'} your attention</strong><p>Review overdue equipment and contact the borrower to arrange a return.</p></div><Button variant="outline" size="sm" onClick={() => navigate('returns')}>Review returns <ArrowRight size={14} /></Button></div>
      )}
      <Card className="data-card">
        <div className="data-card-heading">
          <div><span className="eyebrow">EQUIPMENT OUT</span><h2>Current borrowers</h2><p>Track checked-out items and expected return times.</p></div>
          <Button variant="outline" size="sm" onClick={() => navigate('history')}>History <ArrowUpRight size={15} /></Button>
        </div>
        {checkedOutLoans.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Equipment</TableHead><TableHead>Borrower</TableHead><TableHead>Room</TableHead><TableHead>Return by</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {checkedOutLoans.map((loan) => {
                const item = equipment.find((entry) => entry.id === loan.equipmentId)
                const status = getLoanStatus(loan)
                return (
                  <TableRow key={loan.id}>
                    <TableCell><span className="table-primary">{item?.name ?? 'Equipment'}</span><span className="table-secondary">{item?.id}</span></TableCell>
                    <TableCell><span className="table-primary">{loan.studentName}</span><span className="table-secondary">{loan.studentId || loan.email}</span></TableCell>
                    <TableCell>{loan.room}</TableCell>
                    <TableCell>{formatDateTime(loan.returnAt)}</TableCell>
                    <TableCell><StatusBadge status={status} /></TableCell>
                    <TableCell><Button variant="outline" size="sm" onClick={() => setSelectedLoan(loan)}>Check in</Button></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : <EmptyTable icon={PackageCheck} title="No checked-out equipment" description={reservedCount ? `${reservedCount} reservation${reservedCount === 1 ? ' is' : 's are'} awaiting pickup.` : 'New active loans will appear here.'} />}
        <div className="data-card-footer"><span><span className="live-pulse" /> Live session data</span><button onClick={() => navigate('notifications')}>See notifications <ArrowRight size={14} /></button></div>
      </Card>
      <Card className="staff-shortcuts">
        <CardContent>
          <div><span className="shortcut-icon"><Video size={18} /></span><span><strong>Quick staff actions</strong><small>Keep your equipment desk up to date.</small></span></div>
          <Button variant="outline" onClick={() => navigate('inventory')}>View inventory <ArrowRight size={15} /></Button>
          <Button variant="outline" onClick={() => navigate('returns')}>Process a return <ArrowRight size={15} /></Button>
          <Button variant="outline" onClick={() => navigate('notifications')}>Open alerts <Bell size={15} /></Button>
        </CardContent>
      </Card>
      <ReturnConfirmationDialog
        selectedLoan={selectedLoan}
        equipment={equipment}
        onClose={() => setSelectedLoan(null)}
        onConfirm={confirmReturn}
      />
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

function PickupReservationDetails({ loan, equipment, onRelease, onCancel }) {
  const item = equipment.find((entry) => entry.id === loan.equipmentId)
  return (
    <Card className="data-card">
      <CardContent>
        <div><span className="eyebrow">PICKUP CODE</span><h2>{loan.id}</h2></div>
        <p><strong>Borrower:</strong> {loan.studentName} ({loan.email})</p>
        <p><strong>Equipment:</strong> {item?.name ?? 'Equipment'}</p>
        <p><strong>Room:</strong> {loan.room}</p>
        <p><strong>Return time:</strong> {formatDateTime(loan.returnAt)}</p>
        <div className="form-actions">
          <Button className="primary-action" onClick={() => onRelease(loan.id)}>Release equipment</Button>
          <Button variant="outline" onClick={() => onCancel(loan.id)}>Cancel reservation</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PickupQrScanner({ onDecoded, onClose }) {
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    let scanner
    let startup
    let disposed = false

    const startScanner = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera scanning is not supported here. Use a current browser on HTTPS or localhost.')
        return
      }

      try {
        scanner = new Html5Qrcode('pickup-qr-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        })
        startup = scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!disposed && decodedText.trim()) onDecoded(decodedText.trim())
          },
          () => {},
        )
        await startup
      } catch (error) {
        if (disposed) return
        const message = `${error?.name ?? ''} ${error?.message ?? error}`
        if (/NotAllowedError|permission|denied/i.test(message)) {
          setCameraError('Camera permission was denied. Allow camera access in your browser settings and try again.')
        } else if (/NotFoundError|no camera|camera.*not found/i.test(message)) {
          setCameraError('No camera was found on this device.')
        } else if (/NotReadableError|in use/i.test(message)) {
          setCameraError('The camera is unavailable or already being used by another app.')
        } else {
          setCameraError('Unable to start the camera. Check camera access and try again.')
        }
      }
    }

    startScanner()

    return () => {
      disposed = true
      if (scanner) {
        const stopScanner = async () => {
          try {
            if (scanner.isScanning) await scanner.stop()
            scanner.clear()
          } catch (error) {
            console.error('Unable to stop the pickup QR scanner cleanly.', error)
          }
        }
        if (startup) {
          startup.then(stopScanner, () => {
            try {
              scanner.clear()
            } catch (error) {
              console.error('Unable to clear the pickup QR scanner.', error)
            }
          })
        } else {
          stopScanner()
        }
      }
    }
  }, [onDecoded])

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan pickup code</DialogTitle>
          <DialogDescription>Point the camera at the QR code on the student&apos;s confirmation page.</DialogDescription>
        </DialogHeader>
        <div id="pickup-qr-reader" />
        {cameraError && <p className="form-error" role="alert">{cameraError}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close scanner</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PickupsPage() {
  const { activeLoans, equipment, history, releaseLoan, cancelReservation } = useBorrowing()
  const [pickupCode, setPickupCode] = useState('')
  const [selectedLoanId, setSelectedLoanId] = useState('')
  const [error, setError] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const reservations = activeLoans.filter((loan) => loan.status === 'reserved')
  const selectedLoan = reservations.find((loan) => loan.id === selectedLoanId)

  const findPickupCode = useCallback((inputCode) => {
    const code = inputCode.trim()
    const loan = activeLoans.find((entry) => entry.id === code)
    setError('')
    if (!loan) {
      const previousAction = history.find((entry) => entry.loanId === code)?.action
      setError(previousAction === 'Picked up' || previousAction === 'Returned'
        ? 'This loan has already been released.'
        : previousAction === 'Cancelled'
          ? 'This reservation has been cancelled.'
          : 'No reservation matches that pickup code.')
      setSelectedLoanId('')
      return
    }
    if (loan.status !== 'reserved') {
      setError('This loan has already been released.')
      setSelectedLoanId('')
      return
    }
    setSelectedLoanId(loan.id)
  }, [activeLoans, history])

  const findPickup = (event) => {
    event.preventDefault()
    findPickupCode(pickupCode)
  }

  const handleScannedCode = useCallback((code) => {
    setPickupCode(code)
    setScannerOpen(false)
    findPickupCode(code)
  }, [findPickupCode])

  const handleRelease = (loanId) => {
    const result = releaseLoan(loanId)
    if (result.error) {
      setError(result.error)
      return
    }
    setSelectedLoanId('')
    setPickupCode('')
    setError('')
  }

  const handleCancel = (loanId) => {
    cancelReservation(loanId)
    setSelectedLoanId('')
    setPickupCode('')
    setError('')
  }

  return (
    <div className="page-stack">
      <PageTitle eyebrow="STAFF PORTAL / PICKUPS" title="Release equipment" description="Enter a pickup code to release a reservation to its borrower." />
      <Card className="data-card">
        <CardContent>
          <form className="form-actions" onSubmit={findPickup}>
            <SearchField value={pickupCode} onChange={(value) => { setPickupCode(value); setError('') }} placeholder="Enter pickup code..." />
            <Button className="primary-action" type="submit">Find reservation</Button>
            <Button type="button" variant="outline" onClick={() => setScannerOpen(true)}>Scan QR</Button>
          </form>
          {error && <p className="form-error" role="alert">{error}</p>}
        </CardContent>
      </Card>
      {selectedLoan && (
        <PickupReservationDetails
          loan={selectedLoan}
          equipment={equipment}
          onRelease={handleRelease}
          onCancel={handleCancel}
        />
      )}
      {scannerOpen && <PickupQrScanner onDecoded={handleScannedCode} onClose={() => setScannerOpen(false)} />}
      <Card className="data-card">
        <div className="data-card-heading"><div><span className="eyebrow">AWAITING PICKUP</span><h2>Current reservations</h2><p>{reservations.length} {reservations.length === 1 ? 'reservation' : 'reservations'} waiting to be released</p></div></div>
        {reservations.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Pickup code</TableHead><TableHead>Borrower</TableHead><TableHead>Equipment</TableHead><TableHead>Return time</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>{reservations.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell>{loan.id}</TableCell>
                <TableCell>{loan.studentName}</TableCell>
                <TableCell>{equipment.find((item) => item.id === loan.equipmentId)?.name ?? 'Equipment'}</TableCell>
                <TableCell>{formatDateTime(loan.returnAt)}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedLoanId(loan.id); setPickupCode(loan.id); setError('') }}>View</Button>{' '}
                  <Button size="sm" onClick={() => handleRelease(loan.id)}>Release</Button>{' '}
                  <Button variant="outline" size="sm" onClick={() => handleCancel(loan.id)}>Cancel</Button>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        ) : <EmptyTable icon={PackageCheck} title="No reservations awaiting pickup" description="New borrowing requests will appear here." />}
      </Card>
    </div>
  )
}

export function InventoryPage() {
  const { equipment, activeLoans, addEquipment, updateEquipment, setEquipmentStatus } = useBorrowing()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [formValues, setFormValues] = useState({ id: '', name: '', category: '', location: '' })
  const [formError, setFormError] = useState('')
  const [statusError, setStatusError] = useState('')
  const categories = [...new Set(equipment.map((item) => item.category))]

  const openAddDialog = () => {
    setEditingEquipment(null)
    setFormValues({ id: '', name: '', category: '', location: '' })
    setFormError('')
    setDialogOpen(true)
  }

  const openEditDialog = (item) => {
    setEditingEquipment(item)
    setFormValues({ id: item.id, name: item.name, category: item.category, location: item.location })
    setFormError('')
    setDialogOpen(true)
  }

  const saveEquipment = (event) => {
    event.preventDefault()
    const result = editingEquipment
      ? updateEquipment(editingEquipment.id, formValues)
      : addEquipment(formValues)
    if (result.error) {
      setFormError(result.error)
      return
    }
    setDialogOpen(false)
  }

  const changeEquipmentStatus = (id, nextStatus) => {
    const result = setEquipmentStatus(id, nextStatus)
    setStatusError(result.error ?? '')
  }

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
    reserved: equipment.filter((item) => item.status === 'reserved').length,
    'checked-out': equipment.filter((item) => item.status === 'checked-out').length,
    maintenance: equipment.filter((item) => item.status === 'maintenance').length,
  }

  return (
    <div className="page-stack">
      <PageTitle eyebrow="STAFF PORTAL / EQUIPMENT" title="Equipment inventory" description="A live view of the gear available at the AVR desk." action={<Button className="primary-action" onClick={openAddDialog}><Plus size={16} /> Add equipment</Button>} />
      <Card className="data-card">
        <div className="inventory-toolbar">
          <Tabs value={status} onValueChange={setStatus} className="inventory-tabs">
            <TabsList>
              <TabsTrigger value="all">All <span>{statusCounts.all}</span></TabsTrigger>
              <TabsTrigger value="available">Available <span>{statusCounts.available}</span></TabsTrigger>
              <TabsTrigger value="reserved">Reserved <span>{statusCounts.reserved}</span></TabsTrigger>
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
        {statusError && <p className="form-error" role="alert">{statusError}</p>}
        {filteredEquipment.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Equipment</TableHead><TableHead>Category</TableHead><TableHead>Location</TableHead><TableHead>Borrower</TableHead><TableHead>Status</TableHead><TableHead>Asset ID</TableHead><TableHead>Availability</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredEquipment.map((item) => {
                const loan = activeLoans.find((entry) => entry.equipmentId === item.id)
                const statusLabel = item.status === 'checked-out' ? 'Checked out' : item.status === 'reserved' ? 'Reserved' : item.status === 'maintenance' ? 'Maintenance' : 'Available'
                return (
                  <TableRow key={item.id}>
                    <TableCell><span className="equipment-cell"><span className={`equipment-icon equipment-${item.category.toLowerCase()}`}><Video size={17} /></span><span className="table-primary">{item.name}</span></span></TableCell>
                    <TableCell>{item.category}</TableCell><TableCell>{item.location}</TableCell>
                    <TableCell>{loan ? <span className="table-primary">{loan.studentName}</span> : <span className="muted-cell">—</span>}</TableCell>
                    <TableCell><StatusBadge status={statusLabel} /></TableCell><TableCell className="asset-id">{item.id}</TableCell>
                    <TableCell>
                      <Select
                        value={item.status === 'checked-out' || item.status === 'reserved' ? null : item.status}
                        onValueChange={(nextStatus) => changeEquipmentStatus(item.id, nextStatus)}
                        disabled={item.status === 'checked-out' || item.status === 'reserved'}
                      >
                        <SelectTrigger aria-label={`Set status for ${item.name}`} className="category-select">
                          <SelectValue placeholder={item.status === 'reserved' ? 'Reserved' : 'Checked out'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>Edit</Button></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : <EmptyTable icon={Search} title="No equipment matches" description="Try a different search term or filter." />}
        <div className="data-card-footer"><span>Showing {filteredEquipment.length} of {equipment.length} items</span><span><span className="live-pulse" /> Inventory updates as items are borrowed or returned</span></div>
      </Card>
      <div className="inventory-note"><ShieldAlert size={16} /><span><strong>Maintenance status:</strong> Items under maintenance are hidden from student borrowing requests until cleared.</span></div>
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setFormError('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEquipment ? 'Edit equipment' : 'Add equipment'}</DialogTitle>
            <DialogDescription>{editingEquipment ? 'Update the equipment details in the inventory.' : 'Add a new item to the AVR equipment inventory.'}</DialogDescription>
          </DialogHeader>
          <form className="stacked-form" onSubmit={saveEquipment}>
            <div className="form-field">
              <label className="field-label" htmlFor="equipment-id">Asset ID</label>
              <Input id="equipment-id" value={formValues.id} disabled={Boolean(editingEquipment)} onChange={(event) => setFormValues((current) => ({ ...current, id: event.target.value }))} />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="equipment-name">Name</label>
              <Input id="equipment-name" value={formValues.name} onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="equipment-category">Category</label>
              <Input id="equipment-category" list="equipment-categories" value={formValues.category} onChange={(event) => setFormValues((current) => ({ ...current, category: event.target.value }))} />
              <datalist id="equipment-categories">{categories.map((entry) => <option key={entry} value={entry} />)}</datalist>
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="equipment-location">Location</label>
              <Input id="equipment-location" value={formValues.location} onChange={(event) => setFormValues((current) => ({ ...current, location: event.target.value }))} />
            </div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="primary-action">{editingEquipment ? 'Save changes' : 'Add equipment'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReturnConfirmationDialog({ selectedLoan, equipment, onClose, onConfirm }) {
  const [condition, setCondition] = useState('good')
  const [notes, setNotes] = useState('')
  const closeDialog = () => {
    setCondition('good')
    setNotes('')
    onClose()
  }
  const confirmDialog = () => {
    onConfirm({ condition, notes })
    setCondition('good')
    setNotes('')
  }

  return (
    <Dialog open={Boolean(selectedLoan)} onOpenChange={(open) => { if (!open) closeDialog() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm equipment return</DialogTitle>
          <DialogDescription>Record the item condition before checking it back into the AVR inventory.</DialogDescription>
        </DialogHeader>
        {selectedLoan && <div className="return-confirmation"><span className="confirm-equipment-icon"><Video size={19} /></span><div><strong>{equipment.find((item) => item.id === selectedLoan.equipmentId)?.name}</strong><small>{selectedLoan.studentName} · {selectedLoan.room}</small></div></div>}
        <div className="form-field">
          <label className="field-label" htmlFor="return-condition">Item condition</label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger id="return-condition" className="full-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="missing-parts">Missing parts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="form-field">
          <label className="field-label" htmlFor="return-notes">Notes (optional)</label>
          <Input id="return-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>Cancel</Button>
          <Button className="primary-action" onClick={confirmDialog}><Check size={15} /> Confirm return</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function StaffReturnsPage() {
  const { activeLoans, equipment, returnEquipment } = useBorrowing()
  const [search, setSearch] = useState('')
  const [selectedLoan, setSelectedLoan] = useState(null)
  const query = search.trim().toLowerCase()
  const checkedOutLoans = activeLoans.filter((loan) => loan.status === 'checked-out')
  const filteredLoans = checkedOutLoans.filter((loan) => {
    const item = equipment.find((entry) => entry.id === loan.equipmentId)
    return `${item?.name} ${item?.id} ${loan.studentName} ${loan.email} ${loan.room}`.toLowerCase().includes(query)
  })
  const confirmReturn = ({ condition, notes }) => {
    if (selectedLoan) returnEquipment(selectedLoan.id, { condition, notes })
    setSelectedLoan(null)
  }

  return (
    <div className="page-stack">
      <PageTitle eyebrow="STAFF PORTAL / RETURNS" title="Process returns" description="Search all active loans, then confirm each item has been checked back in." />
      <Card className="data-card">
        <div className="data-card-heading return-toolbar">
          <div><span className="eyebrow">CHECKED-OUT LOANS</span><h2>Items currently checked out</h2><p>{checkedOutLoans.length} {checkedOutLoans.length === 1 ? 'item' : 'items'} waiting to be returned</p></div>
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
        ) : <EmptyTable icon={PackageCheck} title={query ? 'No matching loans found' : 'No checked-out loans'} description={query ? 'Try another item name, borrower, or room.' : 'Reservations awaiting pickup are listed on the Pickups page.'} />}
        <div className="data-card-footer"><span>Returns immediately update the inventory and transaction history.</span><span><CheckCircle2 size={14} /> Check the item condition before confirming</span></div>
      </Card>
      <ReturnConfirmationDialog
        selectedLoan={selectedLoan}
        equipment={equipment}
        onClose={() => setSelectedLoan(null)}
        onConfirm={confirmReturn}
      />
    </div>
  )
}

export function ReturnPage({ navigate }) {
  const { activeLoans, equipment, cancelReservation } = useBorrowing()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const ownLoans = activeLoans.filter((loan) => loan.email === user.email)
  const filteredLoans = ownLoans.filter((loan) => {
    const item = equipment.find((entry) => entry.id === loan.equipmentId)
    return `${item?.name} ${item?.id} ${loan.studentName} ${loan.email} ${loan.room}`.toLowerCase().includes(query)
  })

  return (
    <div className="page-stack">
      <PageTitle eyebrow="STUDENT / MY BORROWINGS" title="My borrowings" description="Review your active loans and pickup codes." />
      <Card className="data-card">
        <div className="data-card-heading return-toolbar">
          <div><span className="eyebrow">YOUR ACTIVE LOANS</span><h2>Items currently checked out</h2><p>{ownLoans.length} {ownLoans.length === 1 ? 'item' : 'items'} active or awaiting pickup</p></div>
          <SearchField value={search} onChange={setSearch} placeholder="Search borrower or item..." />
        </div>
        {filteredLoans.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Equipment</TableHead><TableHead>Borrower</TableHead><TableHead>Room</TableHead><TableHead>Return by</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>{filteredLoans.map((loan) => {
              const item = equipment.find((entry) => entry.id === loan.equipmentId)
              const status = getLoanStatus(loan)
              return <TableRow key={loan.id}><TableCell><span className="table-primary">{item?.name ?? 'Equipment'}</span><span className="table-secondary">{item?.id}</span></TableCell><TableCell><span className="table-primary">{loan.studentName}</span><span className="table-secondary">{loan.email}</span></TableCell><TableCell>{loan.room}</TableCell><TableCell>{formatDateTime(loan.returnAt)}</TableCell><TableCell><StatusBadge status={status} /></TableCell><TableCell><Button variant="outline" size="sm" onClick={() => navigate(`confirmation/${loan.id}`)}>Pickup code</Button>{loan.status === 'reserved' ? <Button size="sm" variant="outline" onClick={() => cancelReservation(loan.id)}>Cancel reservation</Button> : <span className="table-secondary">Return this item to the AVR desk. Staff will check it in.</span>}</TableCell></TableRow>
            })}</TableBody>
          </Table>
        ) : <EmptyTable icon={PackageCheck} title={query ? 'No matching loans found' : 'No active borrowings'} description={query ? 'Try another item name, borrower, or room.' : 'Your active loans will appear here.'} />}
        <div className="data-card-footer"><span>Staff will update inventory and transaction history after check-in.</span><span><CheckCircle2 size={14} /> Return items to the AVR desk for inspection</span></div>
      </Card>
    </div>
  )
}

function escapeCsvField(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function downloadHistoryCsv(rows) {
  const headers = ['Loan ID', 'History ID', 'Equipment', 'Borrower', 'Email', 'Room', 'Activity', 'Condition', 'Notes', 'Date and time']
  const csvRows = rows.map((entry) => [
    entry.loanId,
    entry.id,
    entry.equipmentName,
    entry.studentName,
    entry.email,
    entry.room,
    entry.action,
    entry.condition,
    entry.notes,
    entry.timestamp,
  ])
  const csv = [headers, ...csvRows].map((row) => row.map(escapeCsvField).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `avr-borrowing-history-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function HistoryPage() {
  const { history } = useBorrowing()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const visibleHistory = user.role !== 'student'
    ? history
    : history.filter((entry) => entry.email === user.email)
  const filteredHistory = useMemo(() => visibleHistory.filter((entry) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || `${entry.equipmentName} ${entry.studentName} ${entry.email} ${entry.loanId} ${entry.room}`.toLowerCase().includes(query)
    const matchesAction = action === 'all' || entry.action.toLowerCase() === action
    const entryDate = new Date(entry.timestamp)
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const startDate = new Date(startOfToday)
    if (dateRange === '7-days') startDate.setDate(startDate.getDate() - 6)
    if (dateRange === '30-days') startDate.setDate(startDate.getDate() - 29)
    const matchesDate = dateRange === 'all' || (
      Number.isFinite(entryDate.getTime()) &&
      entryDate >= (dateRange === 'today' ? startOfToday : startDate) &&
      entryDate <= now
    )
    return matchesSearch && matchesAction && matchesDate
  }), [visibleHistory, search, action, dateRange])

  return (
    <div className="page-stack">
      <PageTitle eyebrow={user.role === 'student' ? 'STUDENT / MY RECORDS' : 'STAFF PORTAL / RECORDS'} title={user.role === 'student' ? 'My borrowing history' : 'Borrowing history'} description={user.role === 'student' ? 'Review your equipment check-outs and returns.' : 'Search and review equipment check-outs and returns recorded this session.'} action={<Badge className="inventory-total" variant="outline"><ClipboardList size={14} /> {visibleHistory.length} transactions</Badge>} />
      <Card className="data-card">
        <div className="history-toolbar">
          <SearchField value={search} onChange={setSearch} placeholder="Search borrower, item, or ID..." />
          <div className="history-filters">
            <Select value={action} onValueChange={setAction}><SelectTrigger className="filter-select"><SelectValue placeholder="All activity" /></SelectTrigger><SelectContent><SelectItem value="all">All activity</SelectItem><SelectItem value="borrowed">Borrowed</SelectItem><SelectItem value="reserved">Reserved</SelectItem><SelectItem value="picked up">Picked up</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem><SelectItem value="returned">Returned</SelectItem></SelectContent></Select>
            <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger className="filter-select"><SelectValue placeholder="Any time" /></SelectTrigger><SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="7-days">Last 7 days</SelectItem><SelectItem value="30-days">Last 30 days</SelectItem><SelectItem value="all">Any time</SelectItem></SelectContent></Select>
            {user.role !== 'student' && <Button variant="outline" onClick={() => downloadHistoryCsv(filteredHistory)}><ArrowDownToLine size={15} /> Export CSV</Button>}
          </div>
        </div>
        {filteredHistory.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Transaction</TableHead><TableHead>Equipment</TableHead><TableHead>Borrower</TableHead><TableHead>Room</TableHead><TableHead>Activity</TableHead><TableHead>Date & time</TableHead></TableRow></TableHeader>
            <TableBody>{filteredHistory.map((entry) => <TableRow key={entry.id}><TableCell><span className="table-primary">{entry.loanId}</span><span className="table-secondary">{entry.id}</span></TableCell><TableCell><span className="table-primary">{entry.equipmentName}</span>{user.role !== 'student' && entry.condition && entry.condition !== 'good' && <span className="table-secondary">{entry.condition}{entry.notes ? ` · ${entry.notes}` : ''}</span>}</TableCell><TableCell><span className="table-primary">{entry.studentName}</span><span className="table-secondary">{entry.email}</span></TableCell><TableCell>{entry.room}</TableCell><TableCell><StatusBadge status={entry.action} /></TableCell><TableCell>{formatDateTime(entry.timestamp)}</TableCell></TableRow>)}</TableBody>
          </Table>
        ) : <EmptyTable icon={Search} title="No transactions match those filters" description="Adjust your search, activity type, or date range." />}
        <div className="data-card-footer"><span>Showing {filteredHistory.length} of {visibleHistory.length} transactions</span><span><ChevronDown size={14} /> Records update when an item is borrowed or returned</span></div>
      </Card>
    </div>
  )
}
