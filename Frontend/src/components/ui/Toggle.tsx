import { useState, useEffect } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const Toggle = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
}: ToggleProps) => {
  const [isChecked, setIsChecked] = useState(checked)

  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const handleToggle = () => {
    if (disabled) return
    const newValue = !isChecked
    setIsChecked(newValue)
    onChange(newValue)
  }

  const sizeClasses = {
    sm: 'w-9 h-5',
    md: 'w-11 h-6',
    lg: 'w-14 h-7',
  }

  const dotSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const translateClasses = {
    sm: isChecked ? 'translate-x-4' : 'translate-x-0',
    md: isChecked ? 'translate-x-5' : 'translate-x-0',
    lg: isChecked ? 'translate-x-7' : 'translate-x-0',
  }

  return (
    <div className="flex items-center gap-3">
      {label && (
        <label className="text-sm font-medium text-gray-700 cursor-pointer">
          {label}
        </label>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleToggle}
        className={`
          ${sizeClasses[size]}
          relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${isChecked ? 'bg-primary-600' : 'bg-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            ${dotSizeClasses[size]}
            ${translateClasses[size]}
            inline-block transform rounded-full bg-white transition-transform shadow-sm
          `}
        />
      </button>
    </div>
  )
}
