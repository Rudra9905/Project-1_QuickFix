interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Avatar = ({
  name,
  size = 'md',
  className = '',
}: AvatarProps) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-primary-600 text-white flex items-center justify-center font-medium ${className}`}
    >
      {initials}
    </div>
  )
}
