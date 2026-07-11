import { getRules } from './db'

// Classificação com IA e aprendizado contínuo
export async function classifyTransaction(description, userRules = []) {
  const rules = await getRules()
  const allRules = [...rules, ...userRules]
  
  // Regras personalizadas primeiro
  for (const rule of allRules) {
    if (description.toLowerCase().includes(rule.keyword.toLowerCase())) {
      return { category: rule.category, confidence: 90, method: 'user_rule' }
    }
  }
  
  // Regras padrão
  const defaultRules = [
    { pattern: /aluguel|condominio|iptu|taxa condominial/i, category: 'Fixo' },
    { pattern: /coelba|embasa|energia|eletricidade|luz|agua|saneamento/i, category: 'Fixo' },
    { pattern: /netflix|spotify|apple|amazon prime|disney|hbo|internet|telefone|tim|claro|vivo/i, category: 'Fixo' },
    { pattern: /academia|smart fit|bodytech|ginastica|personal/i, category: 'Fixo' },
    { pattern: /seguro|plano de saude|unimed|sulamerica|amil/i, category: 'Fixo' },
    { pattern: /escola|faculdade|universidade|curso|matricula|mensalidade/i, category: 'Fixo' },
    { pattern: /mercado|supermercado|atacadao|feira|hortifruti|pao|padaria|sacolao/i, category: 'Variável' },
    { pattern: /ifood|delivery|restaurante|lanchonete|bar|cafe|comida|almoco|jantar/i, category: 'Variável' },
    { pattern: /uber|99|taxi|combustivel|gasolina|estacionamento|pedagio|transporte/i, category: 'Variável' },
    { pattern: /shopee|mercado livre|amazon|magalu|casas bahia|eletro|roupa|sapato|presente/i, category: 'Variável' },
    { pattern: /cinema|teatro|show|festa|balada|viagem|hotel|airbnb|passeio/i, category: 'Variável' },
    { pattern: /cabelo|unha|maquiagem|estetica|depilacao|manicure|barbearia/i, category: 'Variável' },
    { pattern: /pix recebido|transferencia recebida|deposito|credito|salario|rendimento|pagamento/i, category: 'Entrada' },
    { pattern: /freela|freelance|projeto|consultoria|servico|boleto recebido/i, category: 'Entrada' },
    { pattern: /investimento|dividendo|juros|resgate|aplicacao/i, category: 'Entrada' }
  ]
  
  for (const rule of defaultRules) {
    if (rule.pattern.test(description)) {
      return { category: rule.category, confidence: 85, method: 'system_rule' }
    }
  }
  
  return { category: 'Outros', confidence: 50, method: 'default' }
}
