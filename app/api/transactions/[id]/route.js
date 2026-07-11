import { NextResponse } from 'next/server'
import { getTransactions, deleteTransaction as deleteTransactionDB } from '@/lib/db'

// DELETE - Remover transação
export async function DELETE(request, { params }) {
  const id = parseInt(params.id)
  await deleteTransactionDB(id)
  
  return NextResponse.json({ success: true })
}

// PUT - Atualizar transação (opcional)
export async function PUT(request, { params }) {
  const id = parseInt(params.id)
  const body = await request.json()
  const transactions = await getTransactions()
  
  const index = transactions.findIndex(t => t.id === id)
  if (index === -1) {
    return NextResponse.json({ success: false, error: 'Transação não encontrada' }, { status: 404 })
  }
  
  transactions[index] = { ...transactions[index], ...body }
  await saveTransactions(transactions)
  
  return NextResponse.json({ success: true, transaction: transactions[index] })
}
