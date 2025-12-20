import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  isLoading?: boolean
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6366F1] text-white hover:from-[#8B5CF6] hover:via-[#9333EA] hover:to-[#7C3AED] hover:shadow-lg hover:shadow-purple-500/50 active:from-[#6D28D9] active:via-[#7C3AED] active:to-[#5B21B6] focus:ring-purple-500 h-12 rounded-xl font-semibold transition-all duration-200',
    secondary:
      'bg-background-card text-[#7C3AED] border-2 border-[#7C3AED] hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 focus:ring-purple-500 h-12 rounded-xl font-medium',
    outline:
      'border-2 border-[#7C3AED] text-[#7C3AED] hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 focus:ring-purple-500 h-12 rounded-xl bg-transparent font-medium',
    ghost:
      'text-[#7C3AED] hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 focus:ring-purple-500 h-12 rounded-xl bg-transparent font-medium',
  }

  const sizes = {
    sm: 'px-5 py-2 text-sm h-10',
    md: 'px-7 py-3 text-sm h-12',
    lg: 'px-9 py-4 text-base h-14',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  )
}