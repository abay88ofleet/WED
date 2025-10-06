interface FolderIconProps {
  isOpen?: boolean;
  isPinned?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FolderIcon({ isOpen = false, isPinned = false, size = 'md', className = '' }: FolderIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSize = sizeClasses[size];

  const closedFolderColor = isPinned ? '#60A5FA' : '#FADB14';
  const closedFolderStroke = isPinned ? '#2563EB' : '#D89614';
  const openFolderColor = isPinned ? '#3B82F6' : '#FDB022';
  const openFolderStroke = isPinned ? '#1D4ED8' : '#D89614';

  return (
    <svg
      className={`${iconSize} ${className} flex-shrink-0 transition-colors duration-200`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {isOpen ? (
        <>
          <path
            d="M20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4H9L11 7H20C21.1046 7 22 7.89543 22 8V18C22 19.1046 21.1046 20 20 20Z"
            fill={openFolderColor}
          />
          <path
            d="M20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4H9L11 7H20C21.1046 7 22 7.89543 22 8V18C22 19.1046 21.1046 20 20 20Z"
            stroke={openFolderStroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H11L9 4H5C3.89543 4 3 4.89543 3 6V7Z"
            fill={closedFolderColor}
          />
          <path
            d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H11L9 4H5C3.89543 4 3 4.89543 3 6V7Z"
            stroke={closedFolderStroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
