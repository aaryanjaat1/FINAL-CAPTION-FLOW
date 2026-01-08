
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading, 
  glow = false,
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-black transition-all duration-500 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest active:scale-95";
  
  const variants = {
    primary: "bg-white text-black hover:bg-white/90 shadow-xl",
    premium: "bg-purple-gradient text-white shadow-lg hover:shadow-purple-500/40",
    secondary: "bg-white/10 text-white border border-white/10 hover:bg-white/20 shadow-sm",
    outline: "border border-white/10 text-white hover:bg-white hover:text-black transition-colors",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg",
    ghost: "bg-transparent text-white/40 hover:text-white hover:bg-white/5"
  };

  const sizes = {
    sm: "px-5 py-2.5 text-[9px]",
    md: "px-8 py-4 text-[10px]",
    lg: "px-12 py-6 text-xs",
    xl: "px-16 py-8 text-sm"
  };

  const glowClass = glow ? 'glow-button' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${glowClass} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};