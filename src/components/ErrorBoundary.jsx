import { Component } from 'react'
import { RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
               style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
            <RefreshCw size={22} style={{ color: '#EF4444' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: '#F9FAFB' }}>
            Ocurrió un error inesperado
          </p>
          <p className="text-xs mb-4" style={{ color: '#CBD5E1' }}>
            {this.props.message || 'Recarga la página o intenta de nuevo.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white"
            style={{ backgroundColor: '#6366F1' }}
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
