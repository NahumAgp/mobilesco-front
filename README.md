# mobilesco-front

Frontend del ERP Mobilesco construido con React y Vite.

## Comandos utiles

```bash
npm install
npm run dev
npm run build
```

## Cambios importantes recientes

### Tipos de insumo

- La gestion de tipos de insumo ya no vive dentro de la pagina principal de `Insumos`.
- Ahora existe un submodulo propio en la ruta `/insumos/tipos`.
- En el sidebar aparece como subboton dentro del modulo `Insumos`.

### Proveedores

- El campo `Tipo de insumo` en proveedores consume el catalogo administrable del backend.
- Desde el formulario de proveedor se puede crear rapidamente un tipo con el boton `+`.
- El popup rapido solo pide el nombre y muestra un codigo sugerido en tiempo real.

### Regla del codigo sugerido

- El codigo se genera con la inicial del nombre.
- Si ya existe, intenta con 2 letras.
- Si sigue repetido, intenta con 3 letras.
- El maximo es 3 caracteres.

## Notas de integracion

- La pantalla de proveedores usa el nombre visible del tipo, pero guarda el codigo.
- La pantalla `/insumos/tipos` permite alta, edicion y activacion/desactivacion del catalogo.
