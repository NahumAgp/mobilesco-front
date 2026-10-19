import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const outputDir = resolve("../tmp/pdfs/reference");
const chair = await readFile(resolve(outputDir, "chair-crop.jpg"));
const products = [
  { id: 1, sku: "SF01", nombre: "Silla escolar formáica", descripcion: "Estructura fabricada en tubular redondo con asiento ergonómico y acabado natural.", activo: true, lineaNombre: "ESCOLAR", familiaId: 6, familiaNombre: "SILLAS", subfamiliaId: 1, subfamiliaNombre: "Concha", modeloId: 1, modeloNombre: "Silla escolar", materialId: 1, materialNombre: "Madera", nivelId: 1, nivelNombre: "Primaria", colorId: 1, colorNombre: "Natural", imagenPrincipalUrl: "/uploads/productos/catalogo/1/chair.jpg" },
  { id: 2, sku: "SF02", nombre: "Silla escolar naranja", descripcion: "Variante con asiento de polipropileno y estructura tubular.", activo: true, lineaNombre: "ESCOLAR", familiaId: 6, familiaNombre: "SILLAS", subfamiliaId: 1, subfamiliaNombre: "Concha", modeloId: 1, modeloNombre: "Silla escolar", materialId: 1, materialNombre: "Madera", nivelId: 1, nivelNombre: "Primaria", colorId: 2, colorNombre: "Naranja", imagenPrincipalUrl: "/uploads/productos/catalogo/2/chair.jpg" },
  { id: 3, sku: "SO01", nombre: "Silla ejecutiva", activo: true, lineaNombre: "OFICINA", familiaId: 11, familiaNombre: "SILLAS", subfamiliaId: 2, subfamiliaNombre: "Ejecutivas", modeloId: 2, modeloNombre: "Silla ejecutiva", imagenPrincipalUrl: "/uploads/productos/catalogo/1/chair.jpg" },
  { id: 4, sku: "ME01", nombre: "Mesa escolar", activo: true, lineaNombre: "ESCOLAR", familiaId: 10, familiaNombre: "MESAS", subfamiliaId: 3, subfamiliaNombre: "Rectangulares", modeloId: 3, modeloNombre: "Mesa escolar", imagenPrincipalUrl: "/uploads/productos/catalogo/1/chair.jpg" },
  { id: 5, sku: "MM01", nombre: "Mesa mixta", activo: true, lineaNombre: "MIXTA", familiaId: 12, familiaNombre: "MESAS", subfamiliaId: 4, subfamiliaNombre: "Multiusos", modeloId: 4, modeloNombre: "Mesa mixta", imagenPrincipalUrl: "/uploads/productos/catalogo/1/chair.jpg" },
  { id: 6, sku: "PU01", nombre: "Pupitre escolar", activo: true, lineaNombre: "ESCOLAR", familiaId: 9, familiaNombre: "PUPITRE", subfamiliaId: 5, subfamiliaNombre: "Individuales", modeloId: 5, modeloNombre: "Pupitre", imagenPrincipalUrl: "/uploads/productos/catalogo/1/chair.jpg" },
];

const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ permisos: ["VIEW_PRODUCT_CATALOG", "VIEW_QUOTES", "ACTION_QUOTES_CREATE"] })));
await page.route("**/api/v1/productos?**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: products, totalPages: 1 }) }));
await page.route("**/uploads/**", (route) => route.fulfill({ status: 200, contentType: "image/jpeg", body: chair }));
await page.goto("http://127.0.0.1:5180/catalogo-preview.html");
await page.getByRole("heading", { name: "Índice del catálogo" }).waitFor();
await page.getByRole("button", { name: /Sillas escolares.*Ver familia/ }).waitFor();
await page.screenshot({ path: resolve(outputDir, "browser-catalogo-index.png"), fullPage: true });
await page.getByRole("button", { name: /Sillas escolares.*Ver familia/ }).click();
await page.getByRole("heading", { name: "Modelos de Sillas escolares" }).waitFor();
await page.screenshot({ path: resolve(outputDir, "browser-catalogo-familia.png"), fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: resolve(outputDir, "browser-catalogo-familia-mobile.png"), fullPage: true });
await page.getByRole("button", { name: "Todas las familias" }).click();
await page.screenshot({ path: resolve(outputDir, "browser-catalogo-index-mobile.png"), fullPage: true });
const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Descargar catálogo PDF" }).click();
const download = await downloadPromise;
await download.saveAs(resolve(outputDir, "browser-catalogo.pdf"));
await page.getByRole("status").filter({ hasText: "Catálogo descargado" }).waitFor();
await browser.close();
const relevantErrors = errors.filter((error) => !error.includes("WebSocket closed without opened"));
if (relevantErrors.length) throw new Error(relevantErrors.join("\n"));
process.stdout.write(`Downloaded ${download.suggestedFilename()}\n`);
