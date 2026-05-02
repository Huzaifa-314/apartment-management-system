import React from 'react';
import { Link, type To } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  /** Renders as `<a href>` (mailto, in-page hash, external). Avoids invalid `<a><button>` nesting. */
  href?: string;
  /** Renders as React Router `<Link>`. Avoids invalid `<Link><button>` nesting. */
  to?: To;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  href,
  to,
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500',
    ghost: 'bg-transparent text-gray-900 hover:bg-gray-100 focus-visible:ring-gray-500',
  };
  
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-lg',
  };

  const labelClassName = `
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className || ''}
      `;

  const isInactive = Boolean(disabled || isLoading);
  const linkClassName = `${labelClassName}${isInactive ? ' pointer-events-none opacity-50' : ''}`;

  const content = (
    <>
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </>
  );

  if (to !== undefined) {
    return (
      <Link
        to={to}
        className={linkClassName}
        aria-disabled={isInactive}
        onClick={(e) => {
          if (isInactive) e.preventDefault();
          onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
        }}
      >
        {content}
      </Link>
    );
  }

  if (href !== undefined) {
    return (
      <a
        href={isInactive ? undefined : href}
        className={linkClassName}
        aria-disabled={isInactive}
        onClick={(e) => {
          if (isInactive) e.preventDefault();
          onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
        }}
      >
        {content}
      </a>
    );
  }
  
  return (
    <button
      className={labelClassName}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;