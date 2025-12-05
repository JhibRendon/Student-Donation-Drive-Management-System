/**
 * Professional Card Component
 * Modern card wrapper with premium styling and animations
 */
import React from "react";

const Card = ({
  children,
  className = "",
  onClick = null,
  variant = "default", // "default", "gradient", "outlined", "elevated"
  gradientFrom = "from-blue-50",
  gradientTo = "to-blue-100",
  hoverEffect = true,
  isPadded = true,
}) => {
  const baseStyles = 
    "rounded-2xl transition-all duration-300 ease-out";
  
  const variantStyles = {
    default: "bg-white border-2 border-gray-300 shadow-xl",
    gradient: `bg-gradient-to-br ${gradientFrom} ${gradientTo} border-2 border-white shadow-xl`,
    outlined: "bg-white border-2 border-gray-400 shadow-xl",
    elevated: "bg-white border-2 border-gray-300 shadow-2xl",
  };

  const hoverStyles = hoverEffect 
    ? "hover:shadow-2xl hover:shadow-blue-300/30 hover:-translate-y-2 cursor-pointer" 
    : "";

  const paddingStyle = isPadded ? "p-6" : "";

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${paddingStyle} ${className}`;

  return (
    <div className={combinedClassName} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
