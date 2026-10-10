import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

const caseStudies = [
  {
    id: 1,
    title: 'Reestruturação da Campanha Q4: Superando o Burnout Criativo',
    description: 'Uma análise detalhada sobre como o time de criação pivotou a estratégia após 3 semanas de estagnação...',
    author: 'Marcos Lima',
    date: '12 Out 2023',
    category: 'Marketing',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
  },
  {
    id: 2,
    title: 'Migração de Servidores: Minimizando o Downtime Crítico',
    description: 'Protocolos estabelecidos durante a transição de infraestrutura que garantiram 99.9% de disponibilidade.',
    author: 'Carla Mendes',
    date: '05 Out 2023',
    category: 'Tech & DevOps',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop',
  },
]

const commonErrors = [
  {
    id: 1,
    title: 'Falha de Sincronização CMS',
    description: 'Ocorre quando o cache do servidor excede 5GB.',
    type: 'error',
  },
  {
    id: 2,
    title: 'Erro de Formatação PDF',
    description: 'Imagens em CMYK podem quebrar a exportação.',
    type: 'warning',
  },
  {
    id: 3,
    title: 'Timeout na API de Tradução',
    description: 'Latência alta detectada nos servidores da AWS.',
    type: 'error',
  },
]

const forumQuestions = [
  {
    id: 1,
    title: 'Como integrar o novo API de pagamentos com o módulo de logística Legado?',
    description: '"Estamos tendo problemas de latência nos webhooks do sandbox..."',
    author: '@rodrigo',
    time: 'há 2 horas',
    votes: 24,
    answers: 12,
    views: 145,
    tag: 'Integrações',
  },
  {
    id: 2,
    title: 'Qual o prazo real para aprovação de férias via portal NextStep?',
    description: 'O prazo oficial é de 5 dias úteis, mas se houver urgência...',
    author: '@jessica',
    time: 'há 1 dia',
    votes: 56,
    answers: 8,
    views: 203,
    tag: 'Recursos Humanos',
    hasBestAnswer: true,
  },
]

export default function KnowledgeBase() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Central de Inteligência</p>
          <h1 className="text-3xl font-bold text-slate-900">Base de Conhecimento Colaborativa</h1>
          <p className="text-slate-600 mt-1">Explore aprendizados, documente experiências e construa a memória técnica da nossa organização.</p>
        </div>
        <Link to="/submit-case">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Submeter Estudo de Caso
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Studies */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900">Estudos de Caso</h3>
              </div>
              <Button variant="outline" size="sm">
                Ver todos
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseStudies.map((study) => (
                <div key={study.id} className="group cursor-pointer">
                  <div className="aspect-video bg-slate-100 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={study.image}
                      alt={study.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <Badge variant="info" className="mb-2">{study.category}</Badge>
                  <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{study.title}</h4>
                  <p className="text-sm text-slate-600 mb-2">{study.description}</p>
                  <p className="text-xs text-slate-500">Por: {study.author} • {study.date}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Forum */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Fórum de Dúvidas</h3>
                <p className="text-sm text-slate-500">Onde a colaboração em tempo real acontece.</p>
              </div>
              <Button variant="outline">Fazer uma Pergunta</Button>
            </div>
            <div className="space-y-4">
              {forumQuestions.map((question) => (
                <div key={question.id} className="flex gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  {/* Votes */}
                  <div className="flex flex-col items-center gap-1">
                    <button className="text-slate-400 hover:text-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <span className="text-sm font-bold text-slate-900">{question.votes}</span>
                    <span className="text-xs text-slate-500">votos</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="info">{question.tag}</Badge>
                      <span className="text-xs text-slate-500">Perguntado por {question.author} {question.time}</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">{question.title}</h4>
                    <p className="text-sm text-slate-600 mb-2">{question.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {question.answers} Respostas
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {question.views} Visualizações
                      </span>
                    </div>
                    {question.hasBestAnswer && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Resposta Selecionada
                        </p>
                        <p className="text-xs text-green-600 mt-1">{question.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Common Errors */}
          <Card className="p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Resolução Rápida</p>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Erros Conhecidos</h3>
            <div className="space-y-3">
              {commonErrors.map((error) => (
                <div key={error.id} className={`p-3 rounded-lg border-l-4 ${error.type === 'error' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'}`}>
                  <div className="flex items-start gap-2">
                    <svg className={`w-5 h-5 mt-0.5 ${error.type === 'error' ? 'text-red-500' : 'text-yellow-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{error.title}</p>
                      <p className="text-xs text-slate-600">{error.description}</p>
                      <button className="text-xs text-blue-600 hover:underline mt-1">Solução</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">Ver Todos os Erros (24)</Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
