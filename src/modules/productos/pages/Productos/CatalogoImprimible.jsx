import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./CatalogoImprimible.css";

const totalModelos = (paginas) => paginas.reduce((total, pagina) => total + pagina.productos.length, 0);

function TarjetaModelo({ producto }) {
  return <article className="catalogo-imp-modelo">
    <div className="catalogo-imp-foto">
      {producto.imagenUrl
        ? <img src={producto.imagenUrl} alt={producto.nombre} />
        : <span>Imagen no disponible</span>}
    </div>
    <div className="catalogo-imp-datos">
      <span className="catalogo-imp-kicker">MODELO MOBILESCO</span>
      <h3>{producto.nombre}</h3>
      <p className="catalogo-imp-sku">SKU: {producto.skus.length > 1 ? `${producto.skus[0]} y ${producto.skus.length - 1} variantes más` : producto.skus[0] || "—"}</p>
      <div className="catalogo-imp-atributo">
        <strong>Tamaños / niveles</strong>
        <div className="catalogo-imp-etiquetas">
          {producto.tamanos.length ? producto.tamanos.map((tamano) => <span key={tamano}>{tamano}</span>) : <small>No especificados</small>}
        </div>
      </div>
      {producto.materiales.length > 0 && <div className="catalogo-imp-atributo">
        <strong>Materiales</strong>
        <p>{producto.materiales.join(" · ")}</p>
      </div>}
      <div className="catalogo-imp-atributo">
        <strong>Colores disponibles</strong>
        <div className="catalogo-imp-colores">
          {producto.colores.length ? producto.colores.map((color) => <span key={color.key} className="catalogo-imp-color">
            <i style={{ backgroundColor: color.hex }} aria-hidden="true" />{color.nombre}
          </span>) : <small>No especificados</small>}
        </div>
      </div>
    </div>
  </article>;
}

export default function CatalogoImprimible({ paginas, onClose }) {
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const cerrarConEscape = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", cerrarConEscape);
    };
  }, [onClose]);

  const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const paginasTotales = paginas.length + 2;
  return createPortal(<div className="catalogo-imp-vista" role="dialog" aria-modal="true" aria-label="Vista previa del catálogo">
    <div className="catalogo-imp-barra">
      <div><strong>Vista previa del catálogo</strong><span>{paginasTotales} páginas · Tamaño carta</span></div>
      <div className="catalogo-imp-acciones">
        <button type="button" onClick={onClose}>Volver al catálogo</button>
        <button type="button" className="catalogo-imp-imprimir" onClick={() => window.print()}>
          Imprimir o guardar en PDF
        </button>
      </div>
    </div>
    <div className="catalogo-imp-paginas">
      <section className="catalogo-imp-pagina catalogo-imp-portada" aria-label="Portada">
        <img src="/logo-mobilesco-firmeza.svg" alt="Mobilesco" />
        <div><span>CATÁLOGO MOBILESCO</span><h1>Espacios para aprender, trabajar y crear.</h1>
          <p>{totalModelos(paginas)} modelos · {fecha}</p></div>
        <small>Edición digital del catálogo Mobilesco</small>
      </section>
      {paginas.map((pagina, indice) => <section className="catalogo-imp-pagina catalogo-imp-interior" key={`${pagina.linea}-${indice}`} aria-label={`${pagina.linea}, página ${indice + 2}`}>
        <header><span>CATÁLOGO MOBILESCO</span><h2>{pagina.linea}</h2></header>
        <div className={`catalogo-imp-lista${pagina.productos.length === 1 ? " catalogo-imp-lista-unica" : ""}`}>
          {pagina.productos.map((producto) => <TarjetaModelo key={`${producto.nombre}-${producto.skus[0]}`} producto={producto} />)}
        </div>
        <footer><span>Mobilesco · Catálogo visual</span><span>{indice + 2} / {paginasTotales}</span></footer>
      </section>)}
      <section className="catalogo-imp-pagina catalogo-imp-contraportada" aria-label="Contraportada">
        <img src="/logo-mobilesco-firmeza.svg" alt="Mobilesco" />
        <div><h2>Elige tu modelo.<br />Cotiza en línea.</h2><p>Explora materiales, niveles y colores en nuestro catálogo visual.</p>
          <a href="https://mobilesco.com.mx">mobilesco.com.mx</a></div>
        <small>Generado el {fecha}</small>
      </section>
    </div>
  </div>, document.body);
}
