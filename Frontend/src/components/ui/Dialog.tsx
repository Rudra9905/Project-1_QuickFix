import * as React from "react"
import { XIcon } from "../icons/CustomIcons"

interface DialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children?: React.ReactNode
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
    // If controlled 'open' prop is provided, use it. Otherwise, we could add internal state,
    // but for this project, we are only using it in a controlled manner.

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={() => onOpenChange?.(false)}
            />
            {/* Pass down close handler to children via context or clones if needed, 
           but for simplicity in this structure, we handle close via backdrop or explicit close button 
       */}
            {children}
        </div>
    )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    className?: string
    hideCloseButton?: boolean
}

export const DialogContent = ({ children, className = "", hideCloseButton, ...props }: DialogContentProps) => {
    // In a real implementation with Radix, we'd get the close handler from context.
    // Here we assume the parent Dialog handles the overlay click. 
    // If we need a close button inside, we might need to pass the close handler down explicitly 
    // or use a context. For now, let's keep it simple.

    return (
        <div
            className={`relative z-50 grid w-full gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg ${className}`}
            {...props}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>
    )
}

export const DialogHeader = ({
    className = "",
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
        {...props}
    />
)

export const DialogTitle = ({
    className = "",
    ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
        className={`text-lg font-semibold leading-none tracking-tight ${className}`}
        {...props}
    />
)
