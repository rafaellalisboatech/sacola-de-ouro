import './globals.css'

export const metadata = {
  title: '💰 Finanças Inteligentes',
  description: 'Seu app de finanças pessoais com IA',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}
