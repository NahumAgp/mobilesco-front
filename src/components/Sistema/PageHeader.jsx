import "./PageHeader.css";

export default function PageHeader({ title, subtitle, eyebrow, actions }) {
  return (
    <div className="page-header">
      <div className="page-header-copy">
        {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>

      {actions && <div className="header-actions">{actions}</div>}
    </div>
  );
}
