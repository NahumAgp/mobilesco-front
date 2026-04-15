import './PageHeader.css';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>

      {/* Si no mandas actions, no aparece nada */}
      {actions && <div className="header-actions">{actions}</div>}
    </div>
  );
}
