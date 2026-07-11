import { NextResponse } from 'next/server'
import { classifyTransaction } from '@/lib/classify'
import { getRules, saveRules } from '@/lib/db'

// POST - Classificar uma transação
export async function POST(request) {
  const body = await request.json()
  const { description } = body
  
  if (!description) {
    return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 })
  }
  
  const result = await classifyTransaction(description)
  
  return NextResponse.json({
    success: true,
    description,
    ...result
  })
}

// PUT - Aprender nova regra
export async function PUT(request) {
  const body = await request.json()
  const { keyword, category } = body
  
  if (!keyword || !category) {
    return NextResponse.json({ error: 'Palavra-chave e categoria são obrigatórias' }, { status: 400 })
  }
  
  const rules = await getRules()
  
  // Verificar se já existe
  const exists = rules.some(r => r.keyword.toLowerCase() === keyword.toLowerCase())
  if (!exists) {
    rules.push({ keyword: keyword.toLowerCase(), category })
    await saveRules(rules)
  }
  
  return NextResponse.json({
    success: true,
    rules
  })
}
