import { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  )
}
