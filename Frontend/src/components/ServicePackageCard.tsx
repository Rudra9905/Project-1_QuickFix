import { Card, CardContent } from './ui/Card'
import { Button } from './ui/Button'

export interface ServicePackage {
    id: number
    name: string
    description: string
    price: number
    duration: string
    includes: string[]
    isPopular?: boolean
}

interface ServicePackageCardProps {
    package: ServicePackage
    onSelect?: () => void
    onEdit?: () => void
    editable?: boolean
    selected?: boolean
}

export const ServicePackageCard = ({
    package: pkg,
    onSelect,
    onEdit,
    editable = false,
    selected = false,
}: ServicePackageCardProps) => {
    return (
        <Card
            className={`relative transition-all ${selected
                    ? 'border-2 border-primary shadow-lg'
                    : 'border border-border hover:border-primary/50'
                } ${pkg.isPopular ? 'ring-2 ring-purple-500/20' : ''}`}
        >
            {pkg.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6366F1] text-white px-4 py-1 rounded-full text-xs font-semibold shadow-md">
                        ⭐ Most Popular
                    </span>
                </div>
            )}

            <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-text-primary">{pkg.name}</h3>
                    <p className="text-sm text-text-secondary line-clamp-2">{pkg.description}</p>
                </div>

                <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#6366F1] bg-clip-text text-transparent">
                            ₹{pkg.price}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                        <span className="material-symbols-outlined text-base">schedule</span>
                        <span>{pkg.duration}</span>
                    </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-border">
                    <p className="text-sm font-medium text-text-primary">What's included:</p>
                    <ul className="space-y-2">
                        {pkg.includes.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                                <span className="material-symbols-outlined text-green-600 text-base mt-0.5">
                                    check_circle
                                </span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="pt-4">
                    {editable ? (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={onEdit}
                        >
                            <span className="material-symbols-outlined text-sm mr-2">edit</span>
                            Edit Package
                        </Button>
                    ) : (
                        <Button
                            className="w-full"
                            onClick={onSelect}
                        >
                            {selected ? 'Selected ✓' : 'Select Package'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
