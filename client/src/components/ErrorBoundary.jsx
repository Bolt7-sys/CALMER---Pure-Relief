import { Component } from 'react'

// Top-level error boundary: a rendering crash shows a branded recovery screen
// instead of a white page (critical for an installed PWA where users can't "F5").
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('CALMER UI crash:', error, info) }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-screen grid place-items-center bg-dark-radial p-6 text-center">
        <div className="max-w-sm">
          <div className="text-5xl mb-4">🌿</div>
          <div className="font-brand text-3xl gold-text">CALMER</div>
          <h1 className="heading text-2xl text-white mt-6">Something drifted off course</h1>
          <p className="text-sm text-soft-gold/60 mt-2 leading-relaxed">
            Take a breath — a small glitch interrupted the flow. Tap below to restore your calm.
          </p>
          <button onClick={() => { this.setState({ error: null }); window.location.assign('/') }}
            className="btn-gold px-8 py-3.5 mt-6">
            <i className="fa-solid fa-rotate-left mr-2"></i>Restore CALMER
          </button>
        </div>
      </div>
    )
  }
}
