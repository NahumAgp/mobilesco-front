export default function CatalogStatusBadge({
  active,
  activeText = "Activo",
  inactiveText = "Inactivo",
  className = ""
}) {
  return (
    <span
      className={[
        active
          ? "badge bg-success-subtle text-success border border-success-subtle"
          : "badge bg-secondary-subtle text-secondary border border-secondary-subtle",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {active ? activeText : inactiveText}
    </span>
  );
}
