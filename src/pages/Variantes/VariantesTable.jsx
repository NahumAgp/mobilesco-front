import React, { useState } from 'react';
import { Camera, Plus, Trash2, Box } from 'lucide-react'; // Usando Lucide para iconos pro

const ProductInterface = () => {
  const [product, setProduct] = useState({ name: '', description: '' });
  const [colors, setColors] = useState([{ id: 1, name: 'Negro', images: [] }]);
  const [sizes, setSizes] = useState(['S', 'M', 'L']);
  
  // Manejar subida de imágenes para un color específico
  const handleImageUpload = (colorId, e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    
    setColors(colors.map(c => 
      c.id === colorId ? { ...c, images: [...c.images, ...newImages] } : c
    ));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Editor de Producto</h1>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
          Publicar Producto
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: DATOS Y ATRIBUTOS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Datos Básicos */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Información General</h2>
            <input 
              type="text" 
              placeholder="Nombre del producto (ej: Hoodie Premium)"
              className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <textarea 
              placeholder="Descripción detallada..."
              className="w-full p-3 border rounded-lg h-32 outline-none"
            ></textarea>
          </div>

          {/* Gestión de Colores e Imágenes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Colores y Galería por Color</h2>
              <button 
                onClick={() => setColors([...colors, { id: Date.now(), name: '', images: [] }])}
                className="text-indigo-600 flex items-center text-sm font-medium"
              >
                <Plus size={16} className="mr-1" /> Añadir Color
              </button>
            </div>

            {colors.map((color) => (
              <div key={color.id} className="mb-6 p-4 border rounded-lg bg-gray-50">
                <div className="flex gap-4 mb-4">
                  <input 
                    type="text" 
                    value={color.name}
                    onChange={(e) => setColors(colors.map(c => c.id === color.id ? {...c, name: e.target.value} : c))}
                    placeholder="Nombre del color"
                    className="flex-1 p-2 border rounded-md"
                  />
                  <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 flex items-center gap-2">
                    <Camera size={18} />
                    <span>Subir Fotos</span>
                    <input type="file" multiple className="hidden" onChange={(e) => handleImageUpload(color.id, e)} />
                  </label>
                </div>

                {/* Previsualización de Imágenes del Color */}
                <div className="flex gap-2 overflow-x-auto">
                  {color.images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 flex-shrink-0">
                      <img src={img} className="w-full h-full object-cover rounded-md border" alt="preview" />
                      <button className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"><Trash2 size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: TALLAS Y RESUMEN DE VARIANTES */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Tallas Disponibles</h2>
            <div className="flex flex-wrap gap-2">
              {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                <button 
                  key={size}
                  className={`px-4 py-2 rounded-md border ${sizes.includes(size) ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white text-gray-500'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Box size={20} /> Resumen de Inventario
            </h2>
            <p className="text-indigo-200 text-sm">
              Se generarán {colors.length * sizes.length} variantes automáticamente.
            </p>
            <div className="mt-4 space-y-2 text-xs opacity-80">
              <p>• {colors.length} Colores con fotos propias.</p>
              <p>• {sizes.length} Tallas asignadas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInterface;