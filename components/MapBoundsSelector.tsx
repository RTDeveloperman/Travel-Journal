
import React, { useEffect, useRef } from 'react';
import L, { Map as LeafletMap, LatLngBounds } from 'leaflet';
import { MapBoundsCoordinates } from '../types';

interface MapBoundsSelectorProps {
  isOpen: boolean;
  onSelect: (bounds: MapBoundsCoordinates) => void;
  onClose: () => void;
}

// Leaflet's default icon paths (ensure this is set up if not globally done)
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapBoundsSelector: React.FC<MapBoundsSelectorProps> = ({ isOpen, onSelect, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([20, 0], 2); // Default world view
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Invalidate size after modal is shown to ensure correct rendering
      setTimeout(() => map.invalidateSize(), 0);
    }
    
    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]); // Re-run effect if isOpen changes

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      modalRef.current?.focus();
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && event.target === modalRef.current.parentElement) {
        onClose();
    }
  };

  const handleConfirmBounds = () => {
    if (mapInstanceRef.current) {
      const bounds: LatLngBounds = mapInstanceRef.current.getBounds();
      const selectedBounds: MapBoundsCoordinates = {
        southWest: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
        northEast: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
      };
      onSelect(selectedBounds);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" // Higher z-index than other modals
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-bounds-selector-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl transform transition-all text-right"
      >
        <h2 id="map-bounds-selector-title" className="text-2xl font-semibold text-slate-800 mb-4">
          انتخاب محدوده روی نقشه
        </h2>
        <p className="text-sm text-slate-600 mb-3">
          نقشه را به محدوده مورد نظر خود برای جستجو ببرید و سپس دکمه "استفاده از نمای فعلی" را بزنید.
        </p>
        <div 
            ref={mapContainerRef} 
            style={{ height: '400px', width: '100%', borderRadius: '8px', marginBottom: '1rem', background: '#eee' }} 
            aria-label="نقشه تعاملی برای انتخاب محدوده جستجو"
        >
            {/* Map will be initialized here */}
        </div>
        <div className="flex justify-end space-x-3 space-x-reverse">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={handleConfirmBounds}
            className="px-5 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
          >
            استفاده از نمای فعلی برای جستجو
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapBoundsSelector;
