import { NextResponse } from 'next/server'
import { getTransactions, getRules } from '@/lib/db'

export async function GET() {
  const transactions = await getTransactions()
  const rules = await getRules()
  
  return NextResponse.json({
    success: true,
    data: {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      transactions,
      rules,
      stats: {
        total: transactions.length,
        categories: ['Fixo', 'Variável', 'Entrada', 'Outros']
      }
    }
  })
}
