import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger-outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    href?: string;
}

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, href, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]";

        const variants: Record<ButtonVariant, string> = {
            primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg shadow-primary/25 hover:shadow-primary/40 focus:ring-primary hover:-translate-y-0.5",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md focus:ring-secondary",
            outline: "border-2 border-border bg-transparent text-foreground hover:bg-muted focus:ring-border",
            ghost: "bg-transparent hover:bg-muted text-foreground focus:ring-muted",
            destructive: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 focus:ring-red-500",
            "danger-outline": "border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 focus:ring-red-500"
        };

        const sizes: Record<ButtonSize, string> = {
            sm: "text-xs px-3 py-1.5 rounded-lg",
            md: "text-sm px-5 py-2.5",
            lg: "text-base px-8 py-3.5",
            icon: "p-2.5"
        };

        const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

        if (href) {
            return (
                <Link href={href} className={combinedClassName} passHref legacyBehavior>
                    <a ref={ref as React.Ref<HTMLAnchorElement>} className={combinedClassName} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {children}
                    </a>
                </Link>
            );
        }

        return (
            <button
                ref={ref as React.Ref<HTMLButtonElement>}
                disabled={disabled || isLoading}
                className={combinedClassName}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && children}
            </button>
        );
    }
);

Button.displayName = 'Button';
