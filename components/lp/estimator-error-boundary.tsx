'use client'

import { Component, type ReactNode } from 'react'

/*
  Guarantees the Phase-6 rule: "If the estimator fails to load, display a
  functional fallback... Never leave a blank estimator section."

  A render error anywhere inside the interactive estimator (bad state, a throw
  in calculation, a hydration mismatch) would otherwise blank the section on a
  paid-traffic page — the worst possible outcome for ad spend. This boundary
  catches that and swaps in the static fallback, which still lets the visitor
  call, text, or book. It is a class component because React error boundaries
  have no hook equivalent.
*/
export class EstimatorErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.log('[v0] estimator crashed, showing fallback:', error)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
