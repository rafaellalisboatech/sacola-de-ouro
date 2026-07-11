import { NextResponse } from 'next/server'
import { addTransaction, getTransactions } from '@/lib/db'

export async function POST(request) {
  const body = await request.json()
  const transactions = body.transactions || []
  
  let imported = 0
  let errors = []
  
  for (const item of transactions) {
    try {
      await addTransaction({
        date: item.date || new Date().toISOString().split('T')[0],
        description: item.description || 'Transação',
        amount: parseFloat(item.amount) || 0,
        type: item.type || 'Saída',
        category: item.category || 'Outros',
        tags: item.tags || []
      })
      imported++
    } catch (error) {
      errors.push({ item, error: error.message })
    }
  }
  
  return NextResponse.json({
    success: true,
    imported,
    errors: errors.length > 0 ? errors : undefined
  })
}
