import { useCallback, useEffect, useState } from 'react'
import { BorrowingContext } from '@/context/borrowingValue'
import {
  DESK_CLOSE_HOUR,
  DESK_OPEN_HOUR,
  MAX_ACTIVE_LOANS_PER_STUDENT,
  MAX_LOAN_HOURS,
  MIN_LEAD_MINUTES,
} from '@/lib/borrowRules'

const initialEquipment = [
  { id: 'AVR-CAM-01', name: 'Canon EOS R50 Camera Kit', category: 'Camera', location: 'AVR Storage', status: 'checked-out' },
  { id: 'AVR-AUD-02', name: 'Wireless Microphone Set', category: 'Audio', location: 'AVR Storage', status: 'available' },
  { id: 'AVR-DIS-03', name: 'Epson PowerLite Projector', category: 'Display', location: 'AVR Storage', status: 'checked-out' },
  { id: 'AVR-AUD-04', name: 'Portable PA Speaker', category: 'Audio', location: 'AVR Storage', status: 'available' },
  { id: 'AVR-CAM-05', name: 'DJI Osmo Mobile Gimbal', category: 'Camera', location: 'AVR Storage', status: 'available' },
  { id: 'AVR-LGT-06', name: 'LED Lighting Kit', category: 'Lighting', location: 'AVR Storage', status: 'maintenance' },
  { id: 'AVR-DIS-07', name: 'HDMI Capture Card', category: 'Display', location: 'AVR Storage', status: 'available' },
  { id: 'AVR-AUD-08', name: 'USB Audio Interface', category: 'Audio', location: 'AVR Storage', status: 'available' },
]

const dateFromHours = (hours) =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

const initialLoans = [
  {
    id: 'AVR-2026-0142',
    equipmentId: 'AVR-CAM-01',
    studentName: 'Mikaela Santos',
    email: 'mikaela.santos@uic.edu.ph',
    room: 'AVR 302',
    borrowedAt: dateFromHours(-3),
    returnAt: dateFromHours(4),
  },
  {
    id: 'AVR-2026-0141',
    equipmentId: 'AVR-DIS-03',
    studentName: 'Joshua Reyes',
    email: 'joshua.reyes@uic.edu.ph',
    room: 'AVR 201',
    borrowedAt: dateFromHours(-28),
    returnAt: dateFromHours(-2),
  },
]

const initialHistory = [
  { id: 'H-004', loanId: 'AVR-2026-0138', equipmentName: 'Portable PA Speaker', studentName: 'Alyssa Cruz', email: 'alyssa.cruz@uic.edu.ph', room: 'AVR 104', action: 'Returned', timestamp: dateFromHours(-24) },
  { id: 'H-003', loanId: 'AVR-2026-0137', equipmentName: 'Wireless Microphone Set', studentName: 'Noah Lim', email: 'noah.lim@uic.edu.ph', room: 'AVR 205', action: 'Borrowed', timestamp: dateFromHours(-36) },
  { id: 'H-002', loanId: 'AVR-2026-0136', equipmentName: 'Canon EOS R50 Camera Kit', studentName: 'Bea Garcia', email: 'bea.garcia@uic.edu.ph', room: 'AVR 302', action: 'Returned', timestamp: dateFromHours(-54) },
  { id: 'H-001', loanId: 'AVR-2026-0135', equipmentName: 'Epson PowerLite Projector', studentName: 'Ethan Flores', email: 'ethan.flores@uic.edu.ph', room: 'AVR 101', action: 'Borrowed', timestamp: dateFromHours(-72) },
]

const initialNotifications = [
  { id: 'N-3', title: 'Overdue equipment', message: 'Epson PowerLite Projector is overdue for return.', time: dateFromHours(-2), kind: 'overdue', read: false },
  { id: 'N-2', title: 'New borrowing request', message: 'Mikaela Santos borrowed a Canon EOS R50 Camera Kit.', time: dateFromHours(-3), kind: 'request', read: false },
  { id: 'N-1', title: 'Item returned', message: 'Alyssa Cruz returned the Portable PA Speaker.', time: dateFromHours(-24), kind: 'return', read: true },
]

const BORROWING_STATE_KEY = 'avr-borrowing-state'

function normalizeLoan(loan) {
  return {
    ...loan,
    status: loan.status === 'reserved' ? 'reserved' : 'checked-out',
    ...(loan.status === 'reserved' && !loan.createdAt ? { createdAt: loan.borrowedAt } : {}),
  }
}

function readBorrowingState() {
  try {
    const stored = window.sessionStorage.getItem(BORROWING_STATE_KEY)
    if (!stored) return null
    const state = JSON.parse(stored)
    if (
      !state ||
      !Array.isArray(state.equipment) ||
      !Array.isArray(state.activeLoans) ||
      !Array.isArray(state.history) ||
      !Array.isArray(state.notifications)
    ) {
      throw new Error('Stored borrowing data is invalid.')
    }
    return {
      equipment: state.equipment,
      activeLoans: state.activeLoans.map(normalizeLoan),
      history: state.history,
      notifications: state.notifications,
    }
  } catch (error) {
    console.error('Unable to restore AVR borrowing data from session storage.', error)
    return null
  }
}

function makeStudentName(email) {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function BorrowingProvider({ children }) {
  const [storedState] = useState(readBorrowingState)
  const [equipment, setEquipment] = useState(storedState?.equipment ?? initialEquipment)
  const [activeLoans, setActiveLoans] = useState(storedState?.activeLoans ?? initialLoans.map(normalizeLoan))
  const [history, setHistory] = useState(storedState?.history ?? initialHistory)
  const [notifications, setNotifications] = useState(storedState?.notifications ?? initialNotifications)
  const [studentEmail, setStudentEmail] = useState('')
  const [studentId, setStudentId] = useState('')
  const [confirmedLoanId, setConfirmedLoanId] = useState(null)

  const validateEquipmentFields = ({ name, category, location }) => {
    if (![name, category, location].every((value) => typeof value === 'string' && value.trim())) {
      return { error: 'Name, category, and location are required.' }
    }
    return null
  }

  const addEquipment = ({ id, name, category, location }) => {
    if (typeof id !== 'string' || !id.trim()) {
      return { error: 'Asset ID is required.' }
    }
    const fieldsError = validateEquipmentFields({ name, category, location })
    if (fieldsError) return fieldsError
    if (equipment.some((item) => item.id.toLowerCase() === id.trim().toLowerCase())) {
      return { error: 'An equipment item with that asset ID already exists.' }
    }
    setEquipment((current) => [
      ...current,
      {
        id: id.trim(),
        name: name.trim(),
        category: category.trim(),
        location: location.trim(),
        status: 'available',
      },
    ])
    return { ok: true }
  }

  const updateEquipment = (id, { name, category, location }) => {
    const item = equipment.find((entry) => entry.id === id)
    if (!item) return { error: 'Equipment item was not found.' }
    const fieldsError = validateEquipmentFields({ name, category, location })
    if (fieldsError) return fieldsError
    setEquipment((current) =>
      current.map((entry) =>
        entry.id === id
          ? { ...entry, name: name.trim(), category: category.trim(), location: location.trim() }
          : entry,
      ),
    )
    return { ok: true }
  }

  const setEquipmentStatus = (id, status) => {
    if (!['available', 'maintenance'].includes(status)) {
      return { error: 'Equipment status must be Available or Maintenance.' }
    }
    const item = equipment.find((entry) => entry.id === id)
    if (!item) return { error: 'Equipment item was not found.' }
    if (item.status === 'checked-out' || item.status === 'reserved' || activeLoans.some((loan) => loan.equipmentId === id)) {
      return { error: 'Checked-out or reserved equipment cannot be moved to another status.' }
    }
    setEquipment((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, status } : entry)),
    )
    return { ok: true }
  }

  const borrowEquipment = ({ email, equipmentId, returnAt, room, name }) => {
    const item = equipment.find((entry) => entry.id === equipmentId)
    if (!item || item.status !== 'available') {
      return { error: 'That equipment is no longer available. Choose another item.' }
    }
    const now = Date.now()
    const studentLoans = activeLoans.filter((loan) => loan.email === email)
    if (studentLoans.length >= MAX_ACTIVE_LOANS_PER_STUDENT) {
      return { error: `You can have at most ${MAX_ACTIVE_LOANS_PER_STUDENT} active loans at a time.` }
    }
    if (studentLoans.some((loan) => loan.status === 'checked-out' && new Date(loan.returnAt).getTime() < now)) {
      return { error: 'Return your overdue item before borrowing again.' }
    }
    const returnTimestamp = new Date(returnAt).getTime()
    if (!Number.isFinite(returnTimestamp)) {
      return { error: 'Choose a valid return date and time.' }
    }
    if (returnTimestamp < now + MIN_LEAD_MINUTES * 60 * 1000) {
      return { error: `Choose a return time at least ${MIN_LEAD_MINUTES} minutes from now.` }
    }
    if (returnTimestamp > now + MAX_LOAN_HOURS * 60 * 60 * 1000) {
      return { error: `Return time cannot be more than ${MAX_LOAN_HOURS} hours from now.` }
    }
    const returnDate = new Date(returnTimestamp)
    const returnMinutes = returnDate.getHours() * 60 + returnDate.getMinutes()
    if (returnMinutes < DESK_OPEN_HOUR * 60 || returnMinutes > DESK_CLOSE_HOUR * 60) {
      const openingPeriod = DESK_OPEN_HOUR < 12 ? 'AM' : 'PM'
      const closingPeriod = DESK_CLOSE_HOUR < 12 ? 'AM' : 'PM'
      const openingHour = DESK_OPEN_HOUR % 12 || 12
      const closingHour = DESK_CLOSE_HOUR % 12 || 12
      return { error: `Choose a return time between ${openingHour}:00 ${openingPeriod} and ${closingHour}:00 ${closingPeriod}.` }
    }
    const existingLoanIds = [
      ...activeLoans.map((loan) => loan.id),
      ...history.map((entry) => entry.loanId),
    ]
    const highestLoanNumber = existingLoanIds.reduce((highest, id) => {
      const match = /^AVR-\d{4}-(\d+)$/.exec(id)
      return match ? Math.max(highest, Number(match[1])) : highest
    }, 0)
    let nextLoanNumber = highestLoanNumber + 1
    let loanId = `AVR-${new Date().getFullYear()}-${String(nextLoanNumber).padStart(4, '0')}`
    while (existingLoanIds.includes(loanId)) {
      nextLoanNumber += 1
      loanId = `AVR-${new Date().getFullYear()}-${String(nextLoanNumber).padStart(4, '0')}`
    }
    const loan = {
      id: loanId,
      equipmentId,
      status: 'reserved',
      studentName: name || makeStudentName(email),
      email,
      ...(studentId ? { studentId } : {}),
      room,
      createdAt: new Date(now).toISOString(),
      borrowedAt: new Date().toISOString(),
      returnAt: new Date(returnTimestamp).toISOString(),
    }
    setEquipment((current) =>
      current.map((entry) =>
        entry.id === equipmentId ? { ...entry, status: 'reserved' } : entry,
      ),
    )
    setActiveLoans((current) => [loan, ...current])
    setHistory((current) => [
      {
        id: `H-${Date.now()}`,
        loanId: loan.id,
        equipmentName: item.name,
        studentName: loan.studentName,
        email,
        room,
        action: 'Reserved',
        timestamp: loan.borrowedAt,
      },
      ...current,
    ])
    setNotifications((current) => [
      {
        id: `N-${Date.now()}`,
        title: 'New borrowing request',
        message: `${loan.studentName} reserved ${item.name}.`,
        time: loan.borrowedAt,
        kind: 'request',
        read: false,
      },
      ...current,
    ])
    setStudentEmail(email)
    setConfirmedLoanId(loan.id)
    try {
      window.sessionStorage.setItem(
        `avr-confirmation-${loan.id}`,
        JSON.stringify({ loan, equipment: item }),
      )
    } catch (error) {
      console.error('Unable to save the AVR confirmation for this session.', error)
    }
    return { loanId: loan.id }
  }

  const releaseLoan = (loanId) => {
    const loan = activeLoans.find((entry) => entry.id === loanId)
    if (!loan) return { error: 'Reservation was not found.' }
    if (loan.status !== 'reserved') return { error: 'This reservation has already been released.' }
    const timestamp = new Date().toISOString()
    const updatedLoan = { ...loan, status: 'checked-out', borrowedAt: timestamp }
    const item = equipment.find((entry) => entry.id === loan.equipmentId)
    const updatedItem = item ? { ...item, status: 'checked-out' } : null
    setActiveLoans((current) => current.map((entry) => entry.id === loanId ? updatedLoan : entry))
    setEquipment((current) =>
      current.map((entry) => entry.id === loan.equipmentId ? { ...entry, status: 'checked-out' } : entry),
    )
    setHistory((current) => [
      {
        id: `H-${Date.now()}`,
        loanId,
        equipmentName: item?.name ?? 'Equipment',
        studentName: loan.studentName,
        email: loan.email,
        room: loan.room,
        action: 'Picked up',
        timestamp,
      },
      ...current,
    ])
    try {
      window.sessionStorage.setItem(
        `avr-confirmation-${loanId}`,
        JSON.stringify({ loan: updatedLoan, equipment: updatedItem ?? item }),
      )
    } catch (error) {
      console.error('Unable to update the AVR confirmation for this session.', error)
    }
    return { ok: true }
  }

  const cancelReservation = useCallback((loanId) => {
    const loan = activeLoans.find((entry) => entry.id === loanId)
    if (!loan || loan.status !== 'reserved') return false
    const item = equipment.find((entry) => entry.id === loan.equipmentId)
    const timestamp = new Date().toISOString()
    setActiveLoans((current) => current.filter((entry) => entry.id !== loanId))
    setEquipment((current) =>
      current.map((entry) =>
        entry.id === loan.equipmentId ? { ...entry, status: 'available' } : entry,
      ),
    )
    setHistory((current) => [
      {
        id: `H-${Date.now()}`,
        loanId,
        equipmentName: item?.name ?? 'Equipment',
        studentName: loan.studentName,
        email: loan.email,
        room: loan.room,
        action: 'Cancelled',
        timestamp,
      },
      ...current,
    ])
    setNotifications((current) => [
      {
        id: `N-${Date.now()}`,
        title: 'Reservation cancelled',
        message: `${loan.studentName}'s reservation for ${item?.name ?? 'equipment'} was cancelled.`,
        time: timestamp,
        kind: 'cancelled',
        read: false,
      },
      ...current,
    ])
    try {
      window.sessionStorage.removeItem(`avr-confirmation-${loanId}`)
    } catch (error) {
      console.error('Unable to remove the cancelled AVR confirmation from this session.', error)
    }
    return true
  }, [activeLoans, equipment])

  const returnEquipment = (loanId, { condition = 'good', notes = '' } = {}) => {
    const loan = activeLoans.find((entry) => entry.id === loanId)
    if (!loan || loan.status !== 'checked-out') return false
    if (!['good', 'damaged', 'missing-parts'].includes(condition)) {
      return { error: 'Choose a valid item condition.' }
    }
    const item = equipment.find((entry) => entry.id === loan.equipmentId)
    const timestamp = new Date().toISOString()
    setActiveLoans((current) => current.filter((entry) => entry.id !== loanId))
    setEquipment((current) =>
      current.map((entry) =>
        entry.id === loan.equipmentId
          ? { ...entry, status: condition === 'good' ? 'available' : 'maintenance' }
          : entry,
      ),
    )
    setHistory((current) => [
      {
        id: `H-${Date.now()}`,
        loanId,
        equipmentName: item?.name ?? 'Equipment',
        studentName: loan.studentName,
        email: loan.email,
        room: loan.room,
        action: 'Returned',
        timestamp,
        condition,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
      ...current,
    ])
    setNotifications((current) => [
      {
        id: `N-${Date.now()}`,
        title: condition === 'good' ? 'Item returned' : 'Item returned with issues',
        message: condition === 'good'
          ? `${loan.studentName} returned ${item?.name ?? 'equipment'}.`
          : `${item?.name ?? 'Equipment'} returned with issues (${condition})`,
        time: timestamp,
        kind: 'return',
        read: false,
      },
      ...current,
    ])
    try {
      window.sessionStorage.removeItem(`avr-confirmation-${loanId}`)
    } catch (error) {
      console.error('Unable to remove the returned AVR confirmation from this session.', error)
    }
    return true
  }

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        BORROWING_STATE_KEY,
        JSON.stringify({ equipment, activeLoans, history, notifications }),
      )
    } catch (error) {
      console.error('Unable to save AVR borrowing data to session storage.', error)
    }
  }, [equipment, activeLoans, history, notifications])

  useEffect(() => {
    const cancelExpiredReservations = () => {
      const cutoff = Date.now() - 2 * 60 * 60 * 1000
      activeLoans
        .filter((loan) =>
          loan.status === 'reserved' &&
          Number.isFinite(new Date(loan.createdAt).getTime()) &&
          new Date(loan.createdAt).getTime() <= cutoff,
        )
        .forEach((loan) => cancelReservation(loan.id))
    }
    cancelExpiredReservations()
    const interval = window.setInterval(cancelExpiredReservations, 60_000)
    return () => window.clearInterval(interval)
  }, [activeLoans, cancelReservation])

  const markNotificationRead = (notificationId) =>
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    )

  const value = {
    equipment,
    activeLoans,
    history,
    notifications,
    studentEmail,
    setStudentEmail,
    studentId,
    setStudentId,
    confirmedLoanId,
    addEquipment,
    updateEquipment,
    setEquipmentStatus,
    borrowEquipment,
    releaseLoan,
    cancelReservation,
    returnEquipment,
    markNotificationRead,
  }

  return (
    <BorrowingContext.Provider value={value}>
      {children}
    </BorrowingContext.Provider>
  )
}
