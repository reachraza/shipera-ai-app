import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full">
                {label && (
                    <label className="block text-sm font-semibold text-foreground">
                        {label} {props.required && <span className="text-red-500">*</span>}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`
            w-full px-4 py-3 bg-muted border rounded-xl 
            focus:ring-2 focus:ring-primary focus:bg-background outline-none transition-all 
            text-sm font-medium text-foreground resize-none leading-relaxed
            placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border focus:border-primary'}
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="text-xs font-medium text-red-500 mt-1">{error}</p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
