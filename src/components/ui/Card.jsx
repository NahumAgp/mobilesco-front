import React from "react";

export default function Card({ 
  children, 
  title, 
  icon,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footer,
  ...props 
}) {
  return (
    <div className={`card shadow-sm border-0 mb-4 ${className}`} {...props}>
      {(title || icon) && (
        <div className={`card-header bg-white py-3 ${headerClassName}`}>
          <h5 className="mb-0 text-secondary">
            {icon && <i className={`${icon} me-2`}></i>}
            {title}
          </h5>
        </div>
      )}
      
      <div className={`card-body ${bodyClassName}`}>
        {children}
      </div>
      
      {footer && (
        <div className="card-footer bg-white border-top-0">
          {footer}
        </div>
      )}
    </div>
  );
}