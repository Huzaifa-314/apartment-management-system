import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  hoverable?: boolean;
  bordered?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  footer,
  header,
  hoverable = false,
  bordered = true,
}) => {
  return (
    <div 
      className={`
        bg-white rounded-lg overflow-hidden
        ${bordered ? 'border border-gray-200' : ''}
        ${hoverable ? 'transition-shadow hover:shadow-md' : 'shadow-sm'}
        ${className}
      `}
    >
      {header && <div className="px-6 py-4">{header}</div>}
      
      {(title || subtitle) && (
        <div className="px-6 pt-5 pb-2">
          {title && <h3 className="text-xl font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      
      <div className="px-6 py-4">{children}</div>
      
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;