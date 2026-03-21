import type { ReactNode } from 'react'

interface ConceptCardProps {
  title: string
  children: ReactNode
}

export default function ConceptCard({ title, children }: ConceptCardProps) {
  return (
    <details className="concept-card">
      <summary>{title}</summary>
      {children}
    </details>
  )
}
