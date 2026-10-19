import { useEffect, useRef, useState } from "react";
import { obtenerOrigenFlete } from "../services/cotizaciones";

const browserKey = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;
let mapsPromise;

function cargarGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      window.__mobilescoMapsReady = () => {
        delete window.__mobilescoMapsReady;
        resolve(window.google.maps);
      };
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(browserKey)}&loading=async&libraries=maps,marker&callback=__mobilescoMapsReady`;
      script.async = true;
      script.onerror = () => {
        delete window.__mobilescoMapsReady;
        reject(new Error("No se pudo cargar el mapa. Revisa su configuración."));
      };
      document.head.appendChild(script);
    }).catch((error) => { mapsPromise = null; throw error; });
  }
  return mapsPromise;
}

function decodificarPolilinea(encoded) {
  const puntos = [];
  let index = 0; let lat = 0; let lng = 0;
  while (index < encoded.length) {
    const coordenadas = [];
    for (let i = 0; i < 2; i += 1) {
      let shift = 0; let value = 0; let byte;
      do {
        if (index >= encoded.length) return puntos;
        byte = encoded.charCodeAt(index++) - 63;
        value |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      coordenadas.push(value & 1 ? ~(value >> 1) : value >> 1);
    }
    lat += coordenadas[0]; lng += coordenadas[1];
    puntos.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return puntos;
}

export default function FleteMapa({ punto, ruta, onSeleccionar }) {
  const divRef = useRef(null);
  const mapaRef = useRef(null);
  const origenRef = useRef(null);
  const destinoRef = useRef(null);
  const lineaRef = useRef(null);
  const seleccionarRef = useRef(onSeleccionar);
  const [error, setError] = useState("");
  const [mapaListo, setMapaListo] = useState(false);

  useEffect(() => { seleccionarRef.current = onSeleccionar; }, [onSeleccionar]);

  useEffect(() => {
    if (!browserKey) return undefined;
    let activo = true;
    Promise.all([cargarGoogleMaps(), obtenerOrigenFlete()]).then(([maps, origen]) => {
      if (!activo || !divRef.current) return;
      const posicion = { lat: origen.latitud, lng: origen.longitud };
      const mapa = new maps.Map(divRef.current, {
        center: posicion, zoom: 11, mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
      });
      mapaRef.current = mapa;
      origenRef.current = new maps.Marker({ map: mapa, position: posicion, title: `Salida: ${origen.nombre}` });
      mapa.addListener("click", (event) => {
        if (event.latLng) seleccionarRef.current({ latitud: event.latLng.lat(), longitud: event.latLng.lng() });
      });
      setMapaListo(true);
    }).catch((e) => { if (activo) setError(e.message || "No se pudo cargar el mapa."); });
    return () => {
      activo = false;
      if (lineaRef.current) lineaRef.current.setMap(null);
      if (destinoRef.current) destinoRef.current.setMap(null);
      if (origenRef.current) origenRef.current.setMap(null);
      mapaRef.current = null;
    };
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    const maps = window.google?.maps;
    if (!mapaListo || !mapa || !maps) return;
    if (lineaRef.current) { lineaRef.current.setMap(null); lineaRef.current = null; }
    const camino = ruta?.polilinea ? decodificarPolilinea(ruta.polilinea) : [];
    if (camino.length) {
      lineaRef.current = new maps.Polyline({ map: mapa, path: camino, strokeColor: "#17604f", strokeOpacity: 0.95, strokeWeight: 5 });
      const bounds = new maps.LatLngBounds();
      camino.forEach((coordenada) => bounds.extend(coordenada));
      mapa.fitBounds(bounds, 40);
    }
    const posicion = camino.at(-1) || (punto ? { lat: punto.latitud, lng: punto.longitud } : null);
    if (destinoRef.current) { destinoRef.current.setMap(null); destinoRef.current = null; }
    if (posicion) {
      destinoRef.current = new maps.Marker({ map: mapa, position: posicion, title: "Entrega" });
      if (!camino.length) mapa.panTo(posicion);
    }
  }, [punto, ruta, mapaListo]);

  if (!browserKey) return <p className="cot-mapa-aviso">El mapa aún no está configurado. Puedes calcular el flete con la dirección de entrega.</p>;
  return <div className="cot-mapa-wrap">
    <div ref={divRef} className="cot-mapa" aria-label="Mapa para elegir el punto de entrega" />
    {error ? <p className="cot-flete-error" role="alert">{error}</p> : <p>Haz clic en el mapa para marcar el punto de entrega.</p>}
  </div>;
}
