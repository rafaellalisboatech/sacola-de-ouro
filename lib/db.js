import { kv } from '@vercel/kv'

const TRANSACTIONS_KEY = 'transactions'
const NEXT_ID_KEY = 'next_id'
const RULES_KEY = 'rules'

// Buscar todas as transações
export async function getTransactions() {
  const transactions = await kv.get(TRANSACTIONS_KEY) || []
  return transactions
}

// Salvar transações
export async function saveTransactions(transactions) {
  await kv.set(TRANSACTIONS_KEY, transactions)
}

// Adicionar uma transação
export async function addTransaction(transaction) {
  const transactions = await getTransactions()
  const nextId = await kv.get(NEXT_ID_KEY) || 1
  
  const newTransaction = {
    id: nextId,
    ...transaction,
    createdAt: new Date().toISOString()
  }
  
  transactions.push(newTransaction)
  await saveTransactions(transactions)
  await kv.set(NEXT_ID_KEY, nextId + 1)
  
  return newTransaction
}

// Remover transação
export async function deleteTransaction(id) {
  let transactions = await getTransactions()
  transactions = transactions.filter(t => t.id !== id)
  await saveTransactions(transactions)
  return true
}

// Buscar regras
export async function getRules() {
  return await kv.get(RULES_KEY) || []
}

// Salvar regras
export async function saveRules(rules) {
  await kv.set(RULES_KEY, rules)
}
