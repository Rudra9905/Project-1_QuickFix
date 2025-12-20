import React from 'react'

interface IconProps {
  className?: string
  size?: number
  color?: string
}

export const GiftBoxIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="20" width="40" height="36" rx="4" fill={color} opacity="0.2" />
    <rect x="12" y="20" width="40" height="36" rx="4" stroke={color} strokeWidth="2" />
    <rect x="20" y="28" width="24" height="20" rx="2" fill={color} opacity="0.3" />
    <path d="M32 8V20M32 8L24 12M32 8L40 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="24" cy="16" r="2" fill={color} />
    <circle cx="40" cy="16" r="2" fill={color} />
    <rect x="28" y="32" width="8" height="12" fill={color} />
  </svg>
)

export const WalletIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="16" width="48" height="36" rx="4" fill={color} opacity="0.15" />
    <rect x="8" y="16" width="48" height="36" rx="4" stroke={color} strokeWidth="2" />
    <rect x="12" y="20" width="32" height="8" rx="2" fill={color} opacity="0.3" />
    <circle cx="44" cy="34" r="6" fill={color} />
    <circle cx="44" cy="34" r="3" fill="white" />
    <rect x="12" y="32" width="20" height="16" rx="2" fill={color} opacity="0.2" />
  </svg>
)

export const AlarmClockIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" fill={color} opacity="0.15" />
    <circle cx="32" cy="32" r="20" stroke={color} strokeWidth="2" />
    <circle cx="32" cy="32" r="2" fill={color} />
    <line x1="32" y1="32" x2="32" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="32" y1="32" x2="40" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M20 12L24 8M44 8L48 12M20 52L24 56M44 56L48 52" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const CalendarIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="16" width="40" height="36" rx="4" fill={color} opacity="0.15" />
    <rect x="12" y="16" width="40" height="36" rx="4" stroke={color} strokeWidth="2" />
    <rect x="12" y="16" width="40" height="12" fill={color} opacity="0.3" />
    <circle cx="24" cy="32" r="2" fill={color} />
    <circle cx="32" cy="32" r="2" fill={color} />
    <circle cx="40" cy="32" r="2" fill={color} />
    <circle cx="24" cy="40" r="2" fill={color} />
    <circle cx="32" cy="40" r="2" fill={color} />
    <circle cx="40" cy="40" r="2" fill={color} />
    <line x1="12" y1="24" x2="52" y2="24" stroke={color} strokeWidth="2" />
  </svg>
)

export const MopBucketIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Bucket */}
    <ellipse cx="32" cy="48" rx="16" ry="4" fill="#FCD34D" opacity="0.3" />
    <path d="M20 48L18 28C18 24 20 20 24 20H40C44 20 46 24 46 28L44 48" fill="#FCD34D" opacity="0.2" />
    <path d="M20 48L18 28C18 24 20 20 24 20H40C44 20 46 24 46 28L44 48" stroke="#FCD34D" strokeWidth="2" />
    {/* Mop */}
    <rect x="28" y="8" width="8" height="20" rx="2" fill="#FCD34D" opacity="0.4" />
    <rect x="28" y="8" width="8" height="20" rx="2" stroke="#FCD34D" strokeWidth="2" />
    <line x1="32" y1="8" x2="32" y2="28" stroke="#FCD34D" strokeWidth="1" />
    <circle cx="32" cy="28" r="6" fill="#FCD34D" opacity="0.3" />
    <circle cx="32" cy="28" r="6" stroke="#FCD34D" strokeWidth="2" />
  </svg>
)

export const CleaningCaddyIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Caddy base */}
    <rect x="16" y="40" width="32" height="16" rx="2" fill="#3B82F6" opacity="0.2" />
    <rect x="16" y="40" width="32" height="16" rx="2" stroke="#3B82F6" strokeWidth="2" />
    {/* Handle */}
    <path d="M20 40C20 36 24 32 32 32C40 32 44 36 44 40" stroke="#3B82F6" strokeWidth="2" fill="none" />
    {/* Bottles */}
    <rect x="20" y="24" width="6" height="16" rx="1" fill="#3B82F6" opacity="0.4" />
    <rect x="20" y="24" width="6" height="16" rx="1" stroke="#3B82F6" strokeWidth="1.5" />
    <rect x="29" y="20" width="6" height="20" rx="1" fill="#3B82F6" opacity="0.4" />
    <rect x="29" y="20" width="6" height="20" rx="1" stroke="#3B82F6" strokeWidth="1.5" />
    <rect x="38" y="26" width="6" height="14" rx="1" fill="#3B82F6" opacity="0.4" />
    <rect x="38" y="26" width="6" height="14" rx="1" stroke="#3B82F6" strokeWidth="1.5" />
    {/* Spray bottle */}
    <rect x="24" y="12" width="8" height="12" rx="1" fill="#3B82F6" opacity="0.3" />
    <rect x="24" y="12" width="8" height="12" rx="1" stroke="#3B82F6" strokeWidth="1.5" />
    <circle cx="28" cy="16" r="1.5" fill="#3B82F6" />
  </svg>
)

export const LaundryBasketIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Basket */}
    <path d="M16 48L20 20C20 16 24 12 28 12H36C40 12 44 16 44 20L48 48" fill="#D97706" opacity="0.2" />
    <path d="M16 48L20 20C20 16 24 12 28 12H36C40 12 44 16 44 20L48 48" stroke="#D97706" strokeWidth="2" />
    <ellipse cx="32" cy="48" rx="16" ry="4" fill="#D97706" opacity="0.3" />
    {/* Clothes */}
    <rect x="22" y="28" width="8" height="12" rx="1" fill="#D97706" opacity="0.4" transform="rotate(-15 26 34)" />
    <rect x="30" y="24" width="8" height="14" rx="1" fill="#D97706" opacity="0.4" transform="rotate(10 34 31)" />
    <rect x="38" y="30" width="6" height="10" rx="1" fill="#D97706" opacity="0.4" transform="rotate(-10 41 35)" />
    <circle cx="26" cy="32" r="2" fill="#D97706" opacity="0.5" />
    <circle cx="36" cy="28" r="2" fill="#D97706" opacity="0.5" />
  </svg>
)

export const DishRackIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Rack base */}
    <rect x="12" y="44" width="40" height="4" fill="#6B7280" opacity="0.4" />
    <rect x="12" y="44" width="40" height="4" stroke="#6B7280" strokeWidth="1" />
    {/* Plates */}
    <circle cx="20" cy="36" r="6" fill="white" opacity="0.8" />
    <circle cx="20" cy="36" r="6" stroke="#6B7280" strokeWidth="1.5" />
    <circle cx="20" cy="36" r="4" fill="none" stroke="#6B7280" strokeWidth="1" />
    <circle cx="32" cy="32" r="7" fill="white" opacity="0.8" />
    <circle cx="32" cy="32" r="7" stroke="#6B7280" strokeWidth="1.5" />
    <circle cx="32" cy="32" r="5" fill="none" stroke="#6B7280" strokeWidth="1" />
    <circle cx="44" cy="34" r="6" fill="white" opacity="0.8" />
    <circle cx="44" cy="34" r="6" stroke="#6B7280" strokeWidth="1.5" />
    <circle cx="44" cy="34" r="4" fill="none" stroke="#6B7280" strokeWidth="1" />
    {/* Bowls */}
    <ellipse cx="24" cy="40" rx="4" ry="2" fill="white" opacity="0.7" />
    <ellipse cx="24" cy="40" rx="4" ry="2" stroke="#6B7280" strokeWidth="1" />
    <ellipse cx="40" cy="42" rx="4" ry="2" fill="white" opacity="0.7" />
    <ellipse cx="40" cy="42" rx="4" ry="2" stroke="#6B7280" strokeWidth="1" />
  </svg>
)

export const ToiletIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Toilet bowl */}
    <ellipse cx="32" cy="48" rx="14" ry="6" fill="#E5E7EB" opacity="0.5" />
    <path d="M20 48C20 40 24 34 32 34C40 34 44 40 44 48" fill="#E5E7EB" opacity="0.3" />
    <path d="M20 48C20 40 24 34 32 34C40 34 44 40 44 48" stroke="#6B7280" strokeWidth="2" />
    {/* Seat */}
    <ellipse cx="32" cy="40" rx="12" ry="4" fill="#9CA3AF" opacity="0.4" />
    <ellipse cx="32" cy="40" rx="12" ry="4" stroke="#6B7280" strokeWidth="1.5" />
    {/* Tank */}
    <rect x="26" y="16" width="12" height="20" rx="2" fill="#E5E7EB" opacity="0.4" />
    <rect x="26" y="16" width="12" height="20" rx="2" stroke="#6B7280" strokeWidth="1.5" />
    <rect x="28" y="18" width="8" height="4" rx="1" fill="#6B7280" opacity="0.3" />
  </svg>
)

export const CuttingBoardIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Board */}
    <rect x="16" y="20" width="32" height="24" rx="2" fill="#D97706" opacity="0.3" />
    <rect x="16" y="20" width="32" height="24" rx="2" stroke="#92400E" strokeWidth="2" />
    {/* Wood grain lines */}
    <line x1="20" y1="24" x2="44" y2="24" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
    <line x1="20" y1="28" x2="44" y2="28" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
    <line x1="20" y1="32" x2="44" y2="32" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
    <line x1="20" y1="36" x2="44" y2="36" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
    {/* Knife */}
    <rect x="28" y="12" width="2" height="12" rx="1" fill="#6B7280" transform="rotate(15 29 18)" />
    <path d="M28 12L30 12L30.5 14L29.5 14Z" fill="#9CA3AF" />
    {/* Tomato */}
    <circle cx="24" cy="30" r="4" fill="#EF4444" opacity="0.8" />
    <circle cx="24" cy="30" r="4" stroke="#DC2626" strokeWidth="1" />
    <path d="M24 26C24 26 22 28 24 30C26 28 24 26 24 26" fill="#FEE2E2" />
    {/* Limes */}
    <circle cx="36" cy="28" r="3" fill="#84CC16" opacity="0.8" />
    <circle cx="36" cy="28" r="3" stroke="#65A30D" strokeWidth="1" />
    <circle cx="40" cy="34" r="3" fill="#84CC16" opacity="0.8" />
    <circle cx="40" cy="34" r="3" stroke="#65A30D" strokeWidth="1" />
  </svg>
)

export const HomeIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 12L12 28V52C12 54 14 56 16 56H24V40C24 38 26 36 28 36H36C38 36 40 38 40 40V56H48C50 56 52 54 52 52V28L32 12Z" fill={color} opacity="0.2" />
    <path d="M32 12L12 28V52C12 54 14 56 16 56H24V40C24 38 26 36 28 36H36C38 36 40 38 40 40V56H48C50 56 52 54 52 52V28L32 12Z" stroke={color} strokeWidth="2" />
    <rect x="28" y="36" width="8" height="20" fill={color} opacity="0.3" />
  </svg>
)

export const UserIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="20" r="10" fill={color} opacity="0.2" />
    <circle cx="32" cy="20" r="10" stroke={color} strokeWidth="2" />
    <path d="M16 52C16 44 22 38 32 38C42 38 48 44 48 52" fill={color} opacity="0.2" />
    <path d="M16 52C16 44 22 38 32 38C42 38 48 44 48 52" stroke={color} strokeWidth="2" />
  </svg>
)

export const StarIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 8L38 24L54 26L42 38L46 54L32 46L18 54L22 38L10 26L26 24L32 8Z" fill={color} opacity="0.3" />
    <path d="M32 8L38 24L54 26L42 38L46 54L32 46L18 54L22 38L10 26L26 24L32 8Z" stroke={color} strokeWidth="2" />
  </svg>
)

export const MapPinIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="24" r="12" fill={color} opacity="0.2" />
    <circle cx="32" cy="24" r="12" stroke={color} strokeWidth="2" />
    <circle cx="32" cy="24" r="6" fill={color} />
    <path d="M32 36L32 56" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M24 48L32 56L40 48" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const CheckCircleIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" fill={color} opacity="0.2" />
    <circle cx="32" cy="32" r="20" stroke={color} strokeWidth="2" />
    <path d="M24 32L30 38L40 26" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ClockIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" fill={color} opacity="0.15" />
    <circle cx="32" cy="32" r="20" stroke={color} strokeWidth="2" />
    <circle cx="32" cy="32" r="2" fill={color} />
    <line x1="32" y1="32" x2="32" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="32" y1="32" x2="42" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const WrenchIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M44 20L40 16L28 28L32 32L44 20Z" fill={color} opacity="0.2" />
    <path d="M44 20L40 16L28 28L32 32L44 20Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 44C20 44 24 48 28 44L32 40L28 36L20 44Z" fill={color} opacity="0.2" />
    <path d="M20 44C20 44 24 48 28 44L32 40L28 36L20 44Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="36" cy="28" r="4" fill={color} opacity="0.3" />
    <circle cx="36" cy="28" r="4" stroke={color} strokeWidth="2" />
  </svg>
)

export const MailIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="16" width="48" height="32" rx="2" fill={color} opacity="0.15" />
    <rect x="8" y="16" width="48" height="32" rx="2" stroke={color} strokeWidth="2" />
    <path d="M8 20L32 36L56 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const PhoneIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="12" width="24" height="40" rx="4" fill={color} opacity="0.15" />
    <rect x="20" y="12" width="24" height="40" rx="4" stroke={color} strokeWidth="2" />
    <rect x="26" y="18" width="12" height="20" rx="1" fill={color} opacity="0.2" />
    <circle cx="32" cy="44" r="2" fill={color} />
  </svg>
)

export const LogOutIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 16H16C14 16 12 18 12 20V44C12 46 14 48 16 48H24" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M32 24L40 32L32 40" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="40" y1="32" x2="24" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const EditIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 16L48 24L28 44L20 44L20 36L40 16Z" fill={color} opacity="0.2" />
    <path d="M40 16L48 24L28 44L20 44L20 36L40 16Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="44" y1="20" x2="40" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const NavigationIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 8L16 48L32 40L48 48L32 8Z" fill={color} opacity="0.3" />
    <path d="M32 8L16 48L32 40L48 48L32 8Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </svg>
)

export const XIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" fill={color} opacity="0.1" />
    <line x1="24" y1="24" x2="40" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="40" y1="24" x2="24" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const MenuIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="16" y1="20" x2="48" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="32" x2="48" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="44" x2="48" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const LayoutDashboardIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="12" width="20" height="20" rx="2" fill={color} opacity="0.2" />
    <rect x="12" y="12" width="20" height="20" rx="2" stroke={color} strokeWidth="2" />
    <rect x="36" y="12" width="16" height="20" rx="2" fill={color} opacity="0.2" />
    <rect x="36" y="12" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
    <rect x="12" y="36" width="40" height="16" rx="2" fill={color} opacity="0.2" />
    <rect x="12" y="36" width="40" height="16" rx="2" stroke={color} strokeWidth="2" />
  </svg>
)

export const UsersIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="18" r="8" fill={color} opacity="0.2" />
    <circle cx="20" cy="18" r="8" stroke={color} strokeWidth="2" />
    <path d="M8 46C8 40 12 36 20 36C28 36 32 40 32 46" fill={color} opacity="0.2" />
    <path d="M8 46C8 40 12 36 20 36C28 36 32 40 32 46" stroke={color} strokeWidth="2" />
    <circle cx="44" cy="18" r="8" fill={color} opacity="0.2" />
    <circle cx="44" cy="18" r="8" stroke={color} strokeWidth="2" />
    <path d="M32 46C32 40 36 36 44 36C52 36 56 40 56 46" fill={color} opacity="0.2" />
    <path d="M32 46C32 40 36 36 44 36C52 36 56 40 56 46" stroke={color} strokeWidth="2" />
  </svg>
)

export const SettingsIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="12" fill={color} opacity="0.15" />
    <circle cx="32" cy="32" r="12" stroke={color} strokeWidth="2" />
    <circle cx="32" cy="32" r="4" fill={color} />
    <path d="M32 8V16M32 48V56M56 32H48M16 32H8M50.9 13.1L45.7 18.3M18.3 45.7L13.1 50.9M50.9 50.9L45.7 45.7M18.3 18.3L13.1 13.1" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const MessageSquareIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="12" width="48" height="36" rx="2" fill={color} opacity="0.15" />
    <rect x="8" y="12" width="48" height="36" rx="2" stroke={color} strokeWidth="2" />
    <path d="M8 20L32 32L56 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="20" cy="28" r="2" fill={color} />
    <circle cx="32" cy="28" r="2" fill={color} />
    <circle cx="44" cy="28" r="2" fill={color} />
  </svg>
)

export const DollarSignIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" fill={color} opacity="0.15" />
    <circle cx="32" cy="32" r="20" stroke={color} strokeWidth="2" />
    <path d="M32 16V48M32 20C30 20 28 22 28 24C28 26 30 28 32 28C34 28 36 30 36 32C36 34 34 36 32 36C30 36 28 38 28 40" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const ArrowLeftIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 16L24 32L40 48" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const XCircleIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" fill={color} opacity="0.1" />
    <circle cx="32" cy="32" r="20" stroke={color} strokeWidth="2" />
    <line x1="24" y1="24" x2="40" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="40" y1="24" x2="24" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const TrendingUpIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 40L28 28L36 36L48 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 24H48V32" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="40" r="2" fill={color} />
    <circle cx="48" cy="24" r="2" fill={color} />
  </svg>
)

export const AlertCircleIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" fill={color} opacity="0.1" />
    <circle cx="32" cy="32" r="20" stroke={color} strokeWidth="2" />
    <circle cx="32" cy="24" r="2" fill={color} />
    <path d="M32 28V40" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const WifiIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 32C24 24 32 24 40 32M24 40C28 36 32 36 36 40M32 48C32 48 32 48 32 48" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="48" r="2" fill={color} />
  </svg>
)

export const WifiOffIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 32C24 24 32 24 40 32M24 40C28 36 32 36 36 40M32 48C32 48 32 48 32 48" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    <circle cx="32" cy="48" r="2" fill={color} opacity="0.3" />
    <line x1="12" y1="12" x2="52" y2="52" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const SearchIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="12" fill={color} opacity="0.1" />
    <circle cx="28" cy="28" r="12" stroke={color} strokeWidth="2" />
    <line x1="36" y1="36" x2="44" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const BellIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#9333EA' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 12C28 12 24 16 24 20V24C20 26 18 30 18 34V42C18 44 20 46 22 46H42C44 46 46 44 46 42V34C46 30 44 26 40 24V20C40 16 36 12 32 12Z" fill={color} opacity="0.1" />
    <path d="M32 12C28 12 24 16 24 20V24C20 26 18 30 18 34V42C18 44 20 46 22 46H42C44 46 46 44 46 42V34C46 30 44 26 40 24V20C40 16 36 12 32 12Z" stroke={color} strokeWidth="2" />
    <path d="M28 46V48C28 50 30 52 32 52C34 52 36 50 36 48V46" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="20" r="2" fill={color} opacity="0.5" />
  </svg>
)

export const ShieldIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#2563EB' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 12L20 18V32C20 40 24 48 32 52C40 48 44 40 44 32V18L32 12Z" fill={color} opacity="0.15" />
    <path d="M32 12L20 18V32C20 40 24 48 32 52C40 48 44 40 44 32V18L32 12Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M28 32L30 34L36 28" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const LightningIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M36 8L20 36H32L28 56L44 28H32L36 8Z" fill={color} opacity="0.2" />
    <path d="M36 8L20 36H32L28 56L44 28H32L36 8Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const HeadphonesIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#5B21B6' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 32C20 24 26 18 34 18C42 18 48 24 48 32V40" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M20 40V48C20 50 22 52 24 52H28V40H20Z" fill={color} opacity="0.15" />
    <path d="M20 40V48C20 50 22 52 24 52H28V40H20Z" stroke={color} strokeWidth="2" />
    <path d="M44 40V48C44 50 42 52 40 52H36V40H44Z" fill={color} opacity="0.15" />
    <path d="M44 40V48C44 50 42 52 40 52H36V40H44Z" stroke={color} strokeWidth="2" />
    <circle cx="24" cy="46" r="2" fill={color} />
    <circle cx="40" cy="46" r="2" fill={color} />
  </svg>
)

export const TagIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 20L20 12L44 36L36 44L12 20Z" fill={color} opacity="0.15" />
    <path d="M12 20L20 12L44 36L36 44L12 20Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="18" cy="18" r="3" fill={color} opacity="0.3" />
    <circle cx="18" cy="18" r="3" stroke={color} strokeWidth="1.5" />
  </svg>
)

export const ArrowRightIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#111827' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 16L40 32L24 48" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// QuickFix Logo Icon - Purple square with white checkmark
export const QuickFixLogoIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#5B21B6' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="12" width="40" height="40" rx="4" fill={color} />
    <path d="M24 32L30 38L40 26" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Cleaning Icon - Blue mop
export const CleaningIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#3B82F6' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="28" y="8" width="8" height="20" rx="2" fill={color} opacity="0.3" />
    <rect x="28" y="8" width="8" height="20" rx="2" stroke={color} strokeWidth="2" />
    <circle cx="32" cy="28" r="8" fill={color} opacity="0.2" />
    <circle cx="32" cy="28" r="8" stroke={color} strokeWidth="2" />
    <ellipse cx="32" cy="48" rx="16" ry="4" fill={color} opacity="0.3" />
    <path d="M18 48L20 32C20 28 22 24 26 24H38C42 24 44 28 44 32L46 48" fill={color} opacity="0.2" />
    <path d="M18 48L20 32C20 28 22 24 26 24H38C42 24 44 28 44 32L46 48" stroke={color} strokeWidth="2" />
  </svg>
)

// Plumbing Icon - Orange water drop
export const PlumbingIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#F97316' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 12C28 12 24 16 24 20V28C24 32 26 36 30 38V48C30 50 32 52 34 52C36 52 38 50 38 48V38C42 36 44 32 44 28V20C44 16 40 12 36 12H32Z" fill={color} opacity="0.2" />
    <path d="M32 12C28 12 24 16 24 20V28C24 32 26 36 30 38V48C30 50 32 52 34 52C36 52 38 50 38 48V38C42 36 44 32 44 28V20C44 16 40 12 36 12H32Z" stroke={color} strokeWidth="2" />
    <circle cx="32" cy="20" r="2" fill={color} />
    <path d="M28 44L36 44" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Painting Icon - Teal paint roller
export const PaintingIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#14B8A6' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="8" width="24" height="32" rx="2" fill={color} opacity="0.2" />
    <rect x="20" y="8" width="24" height="32" rx="2" stroke={color} strokeWidth="2" />
    <rect x="24" y="12" width="16" height="24" rx="1" fill={color} opacity="0.3" />
    <rect x="26" y="44" width="12" height="12" rx="2" fill={color} opacity="0.3" />
    <rect x="26" y="44" width="12" height="12" rx="2" stroke={color} strokeWidth="2" />
    <rect x="28" y="46" width="8" height="8" rx="1" fill={color} opacity="0.4" />
  </svg>
)

// AC Repair Icon - Light blue snowflake/AC
export const ACRepairIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#0EA5E9' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="16" width="32" height="32" rx="2" fill={color} opacity="0.2" />
    <rect x="16" y="16" width="32" height="32" rx="2" stroke={color} strokeWidth="2" />
    <circle cx="32" cy="32" r="8" fill={color} opacity="0.3" />
    <circle cx="32" cy="32" r="8" stroke={color} strokeWidth="2" />
    <path d="M32 20V32M32 32V44M20 32H32M32 32H44M24 24L32 32M32 32L40 40M40 24L32 32M32 32L24 40" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <rect x="20" y="50" width="24" height="4" rx="1" fill={color} opacity="0.3" />
  </svg>
)

// Carpentry Icon - Purple crossed hammer and wrench
export const CarpentryIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#5B21B6' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hammer */}
    <rect x="24" y="20" width="4" height="20" rx="1" fill={color} opacity="0.3" />
    <rect x="24" y="20" width="4" height="20" rx="1" stroke={color} strokeWidth="2" />
    <rect x="20" y="16" width="12" height="6" rx="1" fill={color} opacity="0.4" />
    <rect x="20" y="16" width="12" height="6" rx="1" stroke={color} strokeWidth="2" />
    {/* Wrench */}
    <path d="M40 24L44 28L36 36L32 32L40 24Z" fill={color} opacity="0.2" />
    <path d="M40 24L44 28L36 36L32 32L40 24Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="38" cy="30" r="4" fill={color} opacity="0.3" />
    <circle cx="38" cy="30" r="4" stroke={color} strokeWidth="2" />
    <path d="M42 34L46 38" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Refresh Icon for Recent Activity
export const RefreshIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#6B7280' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M48 28C48 20 42 14 34 14C26 14 20 20 20 28M16 24L20 28L16 32M48 36C48 44 42 50 34 50C26 50 20 44 20 36M48 32L44 36L48 40" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Checkmark Icon for Recent Activity
export const CheckIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#10B981' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="16" fill={color} opacity="0.2" />
    <circle cx="32" cy="32" r="16" stroke={color} strokeWidth="2" />
    <path d="M24 32L30 38L40 28" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Eye/View Icon
export const EyeIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#5B21B6' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="12" fill={color} opacity="0.1" />
    <path d="M32 20C20 20 12 32 32 32C52 32 44 20 32 20Z" stroke={color} strokeWidth="2" />
    <path d="M32 20C44 20 52 32 32 32C12 32 20 20 32 20Z" stroke={color} strokeWidth="2" />
    <circle cx="32" cy="32" r="6" fill={color} />
    <circle cx="32" cy="32" r="3" fill="white" />
  </svg>
)

// Message/Chat Icon
export const MessageIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#5B21B6' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 16L48 16C50 16 52 18 52 20V40C52 42 50 44 48 44H32L20 52V44H16C14 44 12 42 12 40V20C12 18 14 16 16 16Z" fill={color} opacity="0.1" />
    <path d="M16 16L48 16C50 16 52 18 52 20V40C52 42 50 44 48 44H32L20 52V44H16C14 44 12 42 12 40V20C12 18 14 16 16 16Z" stroke={color} strokeWidth="2" />
    <circle cx="24" cy="30" r="2" fill={color} />
    <circle cx="32" cy="30" r="2" fill={color} />
    <circle cx="40" cy="30" r="2" fill={color} />
  </svg>
)

// Reschedule Icon (Calendar with arrows)
export const RescheduleIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#5B21B6' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="16" width="40" height="36" rx="4" fill={color} opacity="0.1" />
    <rect x="12" y="16" width="40" height="36" rx="4" stroke={color} strokeWidth="2" />
    <rect x="12" y="16" width="40" height="12" fill={color} opacity="0.2" />
    <path d="M20 10V22M44 10V22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="24" cy="32" r="2" fill={color} />
    <circle cx="32" cy="32" r="2" fill={color} />
    <circle cx="40" cy="32" r="2" fill={color} />
    <path d="M28 40L24 44L28 48M36 40L40 44L36 48" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Receipt Icon
export const ReceiptIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#6B7280' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 12H48V52L32 44L16 52V12Z" fill={color} opacity="0.1" />
    <path d="M16 12H48V52L32 44L16 52V12Z" stroke={color} strokeWidth="2" />
    <line x1="20" y1="20" x2="44" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="20" y1="28" x2="44" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="20" y1="36" x2="36" y2="36" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Info Icon
export const InfoIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#2563EB' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" fill={color} opacity="0.1" />
    <circle cx="32" cy="32" r="20" stroke={color} strokeWidth="2" />
    <circle cx="32" cy="24" r="2" fill={color} />
    <path d="M32 28V44" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Orange Clock Icon for Upcoming
export const OrangeClockIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#F97316' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" fill={color} opacity="0.15" />
    <circle cx="32" cy="32" r="20" stroke={color} strokeWidth="2" />
    <circle cx="32" cy="32" r="2" fill={color} />
    <line x1="32" y1="32" x2="32" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="32" y1="32" x2="42" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// History Clock Icon (grey)
export const HistoryIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#6B7280' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" fill={color} opacity="0.1" />
    <circle cx="32" cy="32" r="20" stroke={color} strokeWidth="2" />
    <circle cx="32" cy="32" r="2" fill={color} />
    <line x1="32" y1="32" x2="32" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="32" y1="32" x2="42" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M20 20L16 16M48 16L44 20M44 44L48 48M16 48L20 44" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Upload Icon for file uploads
export const UploadIcon: React.FC<IconProps> = ({ className = '', size = 24, color = '#6B7280' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 16V44" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M24 24L32 16L40 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 48H48" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <rect x="20" y="36" width="24" height="2" fill={color} opacity="0.3" />
  </svg>
)
