import { NextResponse } from 'next/server'
import { getTransactions, addTransaction, saveTransactions } from '@/lib/db'
import { classifyTransaction } from '@/lib/classify'

// GET - Listar transações
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const category = searchParams.get('category')
  
  let transactions = await getTransactions()
  
  // Filtrar
  if (month) {
    transactions = transactions.filter(t => t.date && t.date.startsWith(month))
  }
  if (category && category !== 'all') {
    transactions = transactions.filter(t => t.category === category)
  }
  
  // Ordenar por data (mais recente primeiro)
  transactions.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  
  // Calcular estatísticas
  const totalIn = transactions.filter(t => t.type === 'Entrada').reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter(t => t.type === 'Saída').reduce((s, t) => s + t.amount, 0)
  
  return NextResponse.json({
    success: true,
    transactions,
    stats: {
      total: transactions.length,
      totalIn,
      totalOut,
      balance: totalIn - totalOut
    }
  })
}

// POST - Adicionar transação
export async function POST(request) {
  const body = await request.json()
  
  // Classificação automática
  const classification = await classifyTransaction(body.description)
  
  const transaction = {
    date: body.date || new Date().toISOString().split('T')[0],
    description: body.description,
    amount: parseFloat(body.amount) || 0,
    type: body.type || 'Saída',
    category: body.category || classification.category,
    tags: body.tags || []
  }
  
  const newTransaction = await addTransaction(transaction)
  
  return NextResponse.json({
    success: true,
    transaction: newTransaction,
    classified: classification
  })
}
