# Rendimiento de carga inicial

Medición realizada con `npm run build` (Vite 7.3.1, Node y dependencias de
`package-lock.json`) el 30 de julio de 2026.

## Resultado

| Artefacto | Antes | Después | Reducción |
| --- | ---: | ---: | ---: |
| JavaScript principal, minificado | 1,566.32 kB | 344.40 kB | 78.01% |
| JavaScript principal, gzip | 435.31 kB | 107.64 kB | 75.27% |
| CSS principal, minificado | 444.15 kB | 333.92 kB | 24.82% |
| CSS principal, gzip | 65.65 kB | 49.43 kB | 24.71% |

La ruta inicial `/login` añade su chunk de página de 3.47 kB (1.29 kB gzip)
y 5.00 kB de CSS (1.66 kB gzip). El resto de las páginas y sus estilos se
descargan al navegar a su ruta.

## Cambios

- Las páginas se cargan con `React.lazy` y un único fallback accesible de
  navegación. La estructura de rutas, redirecciones, permisos y roles no
  cambió.
- `jsPDF` se importa dinámicamente al ejecutar una acción de generar,
  descargar o compartir una cotización. Su chunk de 384.99 kB (125.80 kB
  gzip), junto con sus dependencias opcionales `html2canvas` y `dompurify`,
  queda fuera tanto de la carga inicial como de la simple visita a
  cotizaciones.
- No se añadieron particiones manuales de paquetes: el corte natural por
  rutas y por la acción PDF ya mantiene todos los chunks por debajo del
  umbral de advertencia de 500 kB de Vite, sin imponer agrupaciones
  artificiales que no reduzcan la descarga inicial.

## Verificación

- `npm run build`: correcto, 2,254 módulos transformados y sin advertencias
  de chunks mayores de 500 kB.
- ESLint de los archivos modificados: correcto.
- `npm run lint`: conserva 10 errores y 14 advertencias preexistentes en
  otros módulos. La medición base, anterior a estos cambios, produjo los
  mismos 24 hallazgos.
