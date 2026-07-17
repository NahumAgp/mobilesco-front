import { useMemo, useState } from "react";

const defaultGetValue = (option) => option?.id ?? option?.value ?? "";
const defaultGetLabel = (option) => option?.nombre ?? option?.name ?? "";
const defaultGetSearchText = (option) =>
  [
    option?.codigo,
    option?.nombre,
    option?.descripcion,
    option?.hex,
    option?.id
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export default function SearchableSelect({
  label,
  value,
  options = [],
  onChange,
  onSearchChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Escribe para filtrar...",
  disabled = false,
  error = "",
  helperText = "",
  loading = false,
  emptyText = "No hay opciones",
  getOptionValue = defaultGetValue,
  getOptionLabel = defaultGetLabel,
  getOptionSearchText = defaultGetSearchText,
  renderOptionLabel,
  actionNode = null,
  keepOpenOnSelect = false,
  className = ""
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => String(getOptionValue(option)) === String(value ?? "")) || null,
    [options, value, getOptionValue]
  );

  const filteredOptions = useMemo(() => {
    const termino = query.toLowerCase().trim();
    if (!termino) return options;
    return options.filter((option) => getOptionSearchText(option).includes(termino));
  }, [options, query, getOptionSearchText]);

  const handleSelect = (option) => {
    const optionValue = getOptionValue(option);
    onChange?.(optionValue, option);
    if (keepOpenOnSelect) {
      setQuery("");
      setOpen(true);
      onSearchChange?.("");
      return;
    }
    setQuery(getOptionLabel(option));
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setOpen(true);
    onChange?.("", null);
  };

  return (
    <div className={`position-relative ${className}`.trim()}>
      {label && <label className="form-label fw-semibold">{label}</label>}

      <div className="d-flex gap-2 align-items-stretch">
        <div className="position-relative flex-grow-1">
          <input
            type="text"
            className={`form-control ${error ? "is-invalid" : ""}`}
            value={open ? query : selectedOption ? getOptionLabel(selectedOption) : ""}
            onFocus={() => {
              setQuery(selectedOption ? getOptionLabel(selectedOption) : "");
              setOpen(true);
              onSearchChange?.(selectedOption ? getOptionLabel(selectedOption) : "");
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              onSearchChange?.(e.target.value);
            }}
            onBlur={() => {
              window.setTimeout(() => setOpen(false), 120);
            }}
            disabled={disabled}
            placeholder={loading ? "Cargando..." : placeholder}
            autoComplete="off"
          />

          {open && !disabled && (
            <div
              className="position-absolute start-0 end-0 bg-white border rounded shadow-sm mt-1"
              style={{ zIndex: 20, maxHeight: "260px", overflowY: "auto" }}
            >
              <div className="border-bottom px-3 py-2 text-muted small">{searchPlaceholder}</div>

              <button
                type="button"
                className="btn btn-link w-100 text-start text-decoration-none px-3 py-2 border-bottom"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
              >
                Limpiar selección
              </button>

              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const optionValue = getOptionValue(option);
                  const optionLabel = renderOptionLabel
                    ? renderOptionLabel(option)
                    : getOptionLabel(option);
                  const isSelected = String(optionValue) === String(value ?? "");

                  return (
                    <button
                      key={String(optionValue)}
                      type="button"
                      className={`list-group-item list-group-item-action border-0 text-start px-3 py-2 ${
                        isSelected ? "active" : ""
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(option)}
                    >
                      {optionLabel}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-muted">{emptyText}</div>
              )}
            </div>
          )}
        </div>

        {actionNode}
      </div>

      {error ? (
        <div className="invalid-feedback d-block">{error}</div>
      ) : helperText ? (
        <div className="form-text">{helperText}</div>
      ) : null}
    </div>
  );
}
