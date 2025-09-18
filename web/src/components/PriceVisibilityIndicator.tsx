import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Lock, Globe } from 'lucide-react';

interface PriceVisibilityIndicatorProps {
  visibility: 'public' | 'private';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
}

const PriceVisibilityIndicator = ({ 
  visibility, 
  size = 'md', 
  showIcon = true, 
  showText = true,
  className = ''
}: PriceVisibilityIndicatorProps) => {
  const isPublic = visibility === 'public';
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  const Icon = isPublic ? Globe : Lock;
  const iconClass = iconSizes[size];

  return (
    <Badge 
      variant={isPublic ? 'default' : 'secondary'} 
      className={`
        ${sizeClasses[size]}
        ${isPublic 
          ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
          : 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
        }
        ${className}
      `}
    >
      {showIcon && <Icon className={`${iconClass} ${showText ? 'mr-1' : ''}`} />}
      {showText && (
        <span className="capitalize">{visibility}</span>
      )}
    </Badge>
  );
};

export default PriceVisibilityIndicator;
