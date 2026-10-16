import { useState } from 'react'
import { BorrowingContext } from '@/context/borrowingValue'

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

function makeStudentName(email) {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function BorrowingProvider({ children }) {
  const [equipment, setEquipment] = useState(initialEquipment)
  const [activeLoans, setActiveLoans] = useState(initialLoans)
  const [history, setHistory] = useState(initialHistory)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [studentEmail, setStudentEmail] = useState('')
  const [confirmedLoanId, setConfirmedLoanId] = useState(null)

  const borrowEquipment = ({ email, equipmentId, returnAt, room }) => {
    const item = equipment.find((entry) => entry.id === equipmentId)
    if (!item || item.status !== 'available') {
      return { error: 'That equipment is no longer available. Choose another item.' }
    }
    const loan = {
      id: `AVR-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      equipmentId,
      studentName: makeStudentName(email),
      email,
      room,
      borrowedAt: new Date().toISOString(),
      returnAt: new Date(returnAt).toISOString(),
    }
    setEquipment((current) =>
      current.map((entry) =>
        entry.id === equipmentId ? { ...entry, status: 'checked-out' } : entry,
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
        action: 'Borrowed',
        timestamp: loan.borrowedAt,
      },
      ...current,
    ])
    setNotifications((current) => [
      {
        id: `N-${Date.now()}`,
        title: 'New borrowing request',
        message: `${loan.studentName} borrowed ${item.name}.`,
        time: loan.borrowedAt,
        kind: 'request',
        read: false,
      },
      ...current,
    ])
    setStudentEmail(email)
    setConfirmedLoanId(loan.id)
    return { loanId: loan.id }
  }

  const returnEquipment = (loanId) => {
    const loan = activeLoans.find((entry) => entry.id === loanId)
    if (!loan) return false
    const item = equipment.find((entry) => entry.id === loan.equipmentId)
    const timestamp = new Date().toISOString()
    setActiveLoans((current) => current.filter((entry) => entry.id !== loanId))
    setEquipment((current) =>
      current.map((entry) =>
        entry.id === loan.equipmentId
          ? { ...entry, status: 'available' }
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
      },
      ...current,
    ])
    setNotifications((current) => [
      {
        id: `N-${Date.now()}`,
        title: 'Item returned',
        message: `${loan.studentName} returned ${item?.name ?? 'equipment'}.`,
        time: timestamp,
        kind: 'return',
        read: false,
      },
      ...current,
    ])
    return true
  }

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
    confirmedLoanId,
    borrowEquipment,
    returnEquipment,
    markNotificationRead,
  }

  return (
    <BorrowingContext.Provider value={value}>
      {children}
    </BorrowingContext.Provider>
  )
}
