import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        const variants: Record<string, string> = {
            default: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
            outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-900",
            ghost: "hover:bg-slate-100 text-slate-900",
            secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
        };

        const sizes: Record<string, string> = {
            default: "h-10 px-4 py-2",
            sm: "h-9 px-3 text-sm",
            lg: "h-11 px-8 text-base",
            icon: "h-10 w-10",
        };

        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
