import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-helper font-label text-text-primary mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-5 py-3.5 border rounded-pill focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary transition-all bg-background-card text-text-primary text-body ${error
              ? 'border-error focus:ring-error'
              : 'border-border'
            } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-helper text-error">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
