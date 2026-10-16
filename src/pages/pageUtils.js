export function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatLongDate(value) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function getLoanStatus(loan) {
  return new Date(loan.returnAt).getTime() < Date.now() ? 'Overdue' : 'Checked out'
}

export function getStatusVariant(status) {
  if (status === 'Overdue' || status === 'Maintenance') return 'destructive'
  if (status === 'Available' || status === 'Returned') return 'secondary'
  return 'outline'
}
