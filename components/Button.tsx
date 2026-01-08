
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest";
  
  const variants = {
    primary: "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20",
    secondary: "bg-white text-black hover:bg-gray-100 shadow-xl",
    outline: "border border-white/10 text-white hover:bg-white/5 hover:border-white/20",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20",
    ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3 text-[11px]",
    lg: "px-10 py-5 text-xs"
  };

  // We check if className already specifies text color or background to avoid conflicts
  const hasCustomBg = className.includes('bg-');
  const hasCustomText = className.includes('text-');
  
  const finalVariantClass = hasCustomBg || hasCustomText ? '' : variants[variant];

  return (
    <button 
      className={`${baseStyles} ${finalVariantClass} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
};
