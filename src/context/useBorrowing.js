import { useContext } from 'react'
import { BorrowingContext } from '@/context/borrowingValue'

export function useBorrowing() {
  const context = useContext(BorrowingContext)
  if (!context) {
    throw new Error('useBorrowing must be used inside BorrowingProvider')
  }
  return context
}
