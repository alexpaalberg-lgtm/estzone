import { SiPlaystation5, SiNintendoswitch } from 'react-icons/si';
import { Gamepad2 } from 'lucide-react';
import type { PlatformInfo } from '@/lib/platform';

interface PlatformIconProps {
  platformInfo: PlatformInfo;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const containerSizeClasses = {
  sm: 'gap-1.5 px-2.5 py-1',
  md: 'gap-2 px-3 py-1.5',
  lg: 'gap-2 px-3 py-2',
};

const textSizeClasses = {
  sm: 'text-xs font-semibold',
  md: 'text-sm font-semibold',
  lg: 'text-base font-bold',
};

function XboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.015 17.489 24 14.863 24 12.004c0-3.34-1.365-6.362-3.57-8.536 0 0-3.535 1.434-5.168 3.159zM3.596 3.468C1.381 5.642 0 8.664 0 12.004c0 2.855.98 5.48 2.633 7.535-1.411-2.604 3.57-9.946 6.08-12.913-1.633-1.721-5.143-3.158-5.117-3.158zM12 3.551S9.066.986 7.258.9c-.246-.012-.553.09-.671.164C8.37.397 10.157 0 12 0c1.857 0 3.639.398 5.418 1.064-.121-.074-.427-.176-.672-.164C14.938.986 12 3.551 12 3.551z"/>
    </svg>
  );
}

export default function PlatformIcon({ platformInfo, size = 'sm', showLabel = true }: PlatformIconProps) {
  const iconClass = sizeClasses[size];
  
  const renderIcon = () => {
    switch (platformInfo.iconName) {
      case 'playstation':
        return <SiPlaystation5 className={iconClass} />;
      case 'xbox':
        return <XboxIcon className={iconClass} />;
      case 'nintendo-switch':
        return <SiNintendoswitch className={iconClass} />;
      default:
        return <Gamepad2 className={iconClass} />;
    }
  };

  return (
    <div 
      className={`inline-flex items-center rounded-md border font-medium shadow-sm ${containerSizeClasses[size]} ${platformInfo.bgColor} ${platformInfo.color}`}
      data-testid="platform-badge"
    >
      {renderIcon()}
      {showLabel && (
        <span className={textSizeClasses[size]}>{platformInfo.label}</span>
      )}
    </div>
  );
}
