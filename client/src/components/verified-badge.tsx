interface VerifiedBadgeProps {
  isVerified: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  showNotVerified?: boolean;
}

export function VerifiedBadge({ isVerified, size = "sm", className = "", showNotVerified = false }: VerifiedBadgeProps) {
  // Made badges even larger for better visibility
  const sizeClasses = {
    sm: "h-8 w-8", // 32px - much larger for better visibility
    md: "h-10 w-10", // 40px - very large for profile sections  
    lg: "h-12 w-12"  // 48px - maximum size for important areas
  };

  if (isVerified) {
    return (
      <img 
        src="https://i.ibb.co/hFHpfj11/images-removebg-preview.png"
        alt="Verified"
        className={`${sizeClasses[size]} ${className}`}
      />
    );
  }

  if (showNotVerified) {
    return (
      <span className={`text-xs text-gray-500 ${className}`}>
        Not Verified
      </span>
    );
  }

  return null;
}