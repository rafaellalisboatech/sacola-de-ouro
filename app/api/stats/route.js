import { NextResponse } from 'next/server'
import { getTransactions } from '@/lib/db'

export async function GET() {
  const transactions = await getTransactions()
  
  const totalIn = transactions.filter(t => t.type === 'Entrada').reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter(t => t.type === 'Saída').reduce((s, t) => s + t.amount, 0)
  
  // Por categoria
  const byCategory = {}
  transactions.filter(t => t.type === 'Saída').forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
  })
  
  // Por mês
  const byMonth = {}
  transactions.forEach(t => {
    const month = t.date ? t.date.substring(0, 7) : 'unknown'
    if (!byMonth[month]) byMonth[month] = { in: 0, out: 0 }
    if (t.type === 'Entrada') {
      byMonth[month].in += t.amount
    } else {
      byMonth[month].out += t.amount
    }
  })
  
  return NextResponse.json({
    success: true,
    stats: {
      total: transactions.length,
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      byCategory,
      byMonth
    }
  })
}
