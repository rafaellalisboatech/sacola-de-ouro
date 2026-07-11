'use client'

import { useState, useEffect, useCallback } from 'react'
import { Chart } from 'chart.js'
import { useRef } from 'react'

export default function Home() {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({ totalIn: 0, totalOut: 0, balance: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [uploadStatus, setUploadStatus] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  
  const pieChartRef = useRef(null)
  const pieChartInstance = useRef(null)

  // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      let url = '/api/transactions?'
      if (filterMonth) url += `month=${filterMonth}&`
      if (filterCategory !== 'all') url += `category=${filterCategory}`
      
      const res = await fetch(url)
      const data = await res.json()
      
      if (data.success) {
        setTransactions(data.transactions || [])
        setStats(data.stats || { totalIn: 0, totalOut: 0, balance: 0, total: 0 })
      }
    } catch (error) {
      console.error('Erro ao carregar:', error)
    } finally {
      setLoading(false)
    }
  }, [filterMonth, filterCategory])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Atualizar gráfico quando mudar
  useEffect(() => {
    if (transactions.length > 0) {
      updateChart()
    }
  }, [transactions])

  // Função para atualizar gráfico de pizza
  function updateChart() {
    const ctx = document.getElementById('pieChart')
    if (!ctx) return

    // Calcular gastos por categoria
    const categories = {}
    transactions.filter(t => t.type === 'Saída').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount
    })

    const labels = Object.keys(categories)
    const data = Object.values(categories)
    const colors = ['#4f46e5', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#f97316']

    if (pieChartInstance.current) {
      pieChartInstance.current.destroy()
    }

    pieChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Sem dados'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: colors.slice(0, labels.length || 1),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 10, usePointStyle: true, font: { size: 11 } }
          }
        },
        cutout: '60%'
      }
    })
  }

  // Upload de arquivo
  async function handleFileUpload(event) {
    const files = event.target.files
    if (!files.length) return

    setUploadStatus('🔄 Processando arquivo...')
    
    try {
      const file = files[0]
      const text = await file.text()
      const transactions = parseCSV(text)
      
      if (transactions.length === 0) {
        setUploadStatus('⚠️ Nenhuma transação encontrada no arquivo.')
        return
      }

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions })
      })

      const data = await res.json()
      
      if (data.success) {
        setUploadStatus(`✅ ${data.imported} transações importadas!`)
        loadData()
        // Resetar input
        event.target.value = ''
        setTimeout(() => setUploadStatus(''), 3000)
      } else {
        setUploadStatus('❌ Erro ao importar.')
      }
    } catch (error) {
      setUploadStatus('❌ Erro ao processar arquivo.')
      console.error(error)
    }
  }

  // Colar texto
  async function handlePaste() {
    const text = document.getElementById('pasteArea').value
    if (!text.trim()) {
      setUploadStatus('⚠️ Cole o conteúdo do extrato.')
      return
    }

    setUploadStatus('🔄 Processando...')
    
    try {
      const transactions = parseCSV(text)
      
      if (transactions.length === 0) {
        setUploadStatus('⚠️ Nenhuma transação encontrada.')
        return
      }

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions })
      })

      const data = await res.json()
      
      if (data.success) {
        setUploadStatus(`✅ ${data.imported} transações importadas!`)
        document.getElementById('pasteArea').value = ''
        loadData()
        setTimeout(() => setUploadStatus(''), 3000)
      } else {
        setUploadStatus('❌ Erro ao importar.')
      }
    } catch (error) {
      setUploadStatus('❌ Erro ao processar.')
      console.error(error)
    }
  }

  // Adicionar manual
  async function addManual() {
    const date = document.getElementById('manualDate').value
    const desc = document.getElementById('manualDesc').value.trim()
    const amount = parseFloat(document.getElementById('manualAmount').value)
    const type = document.getElementById('manualType').value

    if (!date || !desc || !amount) {
      setUploadStatus('⚠️ Preencha todos os campos.')
      return
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, description: desc, amount, type })
      })

      const data = await res.json()
      
      if (data.success) {
        setUploadStatus('✅ Transação adicionada!')
        document.getElementById('manualDesc').value = ''
        document.getElementById('manualAmount').value = ''
        loadData()
        setTimeout(() => setUploadStatus(''), 3000)
      } else {
        setUploadStatus('❌ Erro ao adicionar.')
      }
    } catch (error) {
      setUploadStatus('❌ Erro ao adicionar.')
      console.error(error)
    }
  }

  // Deletar transação
  async function deleteTransaction(id) {
    if (!confirm('Remover esta transação?')) return
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      loadData()
    } catch (error) {
      console.error('Erro ao deletar:', error)
    }
  }

  // Exportar dados
  async function exportData() {
    try {
      const res = await fetch('/api/export')
      const data = await res.json()
      
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `financas_${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erro ao exportar:', error)
    }
  }

  // Parser CSV
  function parseCSV(content) {
    const lines = content.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    
    let sep = lines[0].includes(';') ? ';' : ','
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase())
    const transactions = []
    
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(sep).map(v => v.trim())
      if (vals.length < 2) continue
      
      const obj = {}
      headers.forEach((h, idx) => obj[h] = vals[idx] || '')
      
      let date = obj.data || obj.dtpostado || obj.date || ''
      let desc = obj.descrição || obj.descricao || obj.memo || 'Transação'
      let amount = parseFloat((obj.valor || '0').replace(',', '.'))
      let type = obj.tipo || ''
      
      if (!date && obj.dtpostado) date = obj.dtpostado
      
      const isEntry = type.toLowerCase().includes('entrada') || 
                     type.toLowerCase().includes('credito') ||
                     amount > 0
      
      // Formatar data
      let formattedDate = date
      if (date.match(/(\d{2})\/(\d{2})\/(\d{4})/)) {
        const parts = date.split('/')
        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
      }
      
      transactions.push({
        date: formattedDate || new Date().toISOString().split('T')[0],
        description: desc,
        amount: Math.abs(amount) || 0,
        type: isEntry ? 'Entrada' : 'Saída'
      })
    }
    
    return transactions
  }

  // Drag and Drop
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length) {
      const input = document.getElementById('fileInput')
      const dt = new DataTransfer()
      Array.from(files).forEach(f => dt.items.add(f))
      input.files = dt.files
      handleFileUpload({ target: { files: input.files } })
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-indigo-800 flex items-center gap-2">
            💰 Finanças Inteligentes
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">v3.0</span>
          </h1>
          <p className="text-sm text-gray-500">Gerencie suas finanças com IA</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm transition">
            🔄 Atualizar
          </button>
          <button onClick={exportData} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-sm transition">
            💾 Exportar
          </button>
        </div>
      </header>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <p className="text-xs text-gray-500">📥 Entradas</p>
          <p className="text-xl font-bold text-emerald-600">R$ {stats.totalIn.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <p className="text-xs text-gray-500">📤 Saídas</p>
          <p className="text-xl font-bold text-rose-600">R$ {stats.totalOut.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <p className="text-xs text-gray-500">💰 Saldo</p>
          <p className={`text-xl font-bold ${stats.balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
            R$ {stats.balance.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <p className="text-xs text-gray-500">📊 Transações</p>
          <p className="text-xl font-bold text-gray-700">{stats.total}</p>
        </div>
      </div>

      {/* Upload Area */}
      <div 
        className={`bg-white p-6 rounded-xl shadow-sm mb-6 transition-all ${isDragging ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <h3 className="font-semibold text-gray-700 mb-3">📤 Adicionar Transações</h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block">
              <span className="sr-only">Selecionar arquivo</span>
              <input
                type="file"
                id="fileInput"
                accept=".csv,.ofx"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition"
                onChange={handleFileUpload}
              />
            </label>
            <p className="text-xs text-gray-400 mt-1">Suporta: CSV, OFX (arraste ou clique)</p>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex gap-2">
              <input
                type="text"
                id="pasteArea"
                placeholder="Ou cole o CSV aqui..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button onClick={handlePaste} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition whitespace-nowrap">
                Importar
              </button>
            </div>
          </div>
        </div>
        {uploadStatus && (
          <div className={`mt-3 text-sm animate-slide-up p-2 rounded-lg ${
            uploadStatus.includes('✅') ? 'bg-emerald-50 text-emerald-700' :
            uploadStatus.includes('⚠️') ? 'bg-amber-50 text-amber-700' :
            uploadStatus.includes('❌') ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {uploadStatus}
          </div>
        )}
      </div>

      {/* Filtros + Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-3">📊 Distribuição de Gastos</h3>
          <div className="h-64">
            <canvas id="pieChart"></canvas>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-3">🔍 Filtros</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Mês</label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Categoria</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="all">Todas</option>
                <option value="Fixo">Fixo</option>
                <option value="Variável">Variável</option>
                <option value="Entrada">Entrada</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <button onClick={() => { setFilterMonth(''); setFilterCategory('all') }} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm transition">
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Adicionar Manual */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">✏️ Adicionar Manualmente</h3>
        <div className="flex flex-wrap gap-3">
          <input type="date" id="manualDate" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <input type="text" id="manualDesc" placeholder="Descrição" className="flex-1 min-w-[150px] border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <input type="number" id="manualAmount" placeholder="Valor" step="0.01" className="w-32 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <select id="manualType" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="Saída">Saída</option>
            <option value="Entrada">Entrada</option>
          </select>
          <button onClick={addManual} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">
            ➕ Adicionar
          </button>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">📋 Transações</h3>
          <span className="text-xs text-gray-400">{transactions.length} registros</span>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-600">Data</th>
                <th className="p-3 text-left font-semibold text-gray-600">Descrição</th>
                <th className="p-3 text-right font-semibold text-gray-600">Valor</th>
                <th className="p-3 text-left font-semibold text-gray-600">Categoria</th>
                <th className="p-3 text-left font-semibold text-gray-600">Tipo</th>
                <th className="p-3 text-center font-semibold text-gray-600">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-400">Carregando...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-400">Nenhuma transação encontrada</td></tr>
              ) : (
                transactions.slice(0, 50).map((t) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3">{t.date ? t.date.split('-').reverse().join('/') : '-'}</td>
                    <td className="p-3 font-medium">{t.description}</td>
                    <td className={`p-3 text-right font-mono ${t.type === 'Entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'Entrada' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span className={`badge badge-${t.category?.toLowerCase() || 'outros'}`}>
                        {t.category || 'Outros'}
                      </span>
                    </td>
                    <td className="p-3">{t.type}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => deleteTransaction(t.id)} className="text-red-400 hover:text-red-600 transition text-sm">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
