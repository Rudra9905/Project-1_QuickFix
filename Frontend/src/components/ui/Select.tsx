import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-helper font-label text-text-primary mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-4 py-3 border rounded-pill focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary transition-all bg-background-card text-text-primary text-body ${
            error
              ? 'border-error focus:ring-error'
              : 'border-border'
          } ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-helper text-error">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
