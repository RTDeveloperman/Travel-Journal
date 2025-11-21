import React, { useEffect, useRef, useState } from 'react';
import L, { LatLng, LeafletMouseEvent, Map, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates } from '../types';

interface MapPickerProps {
  onLocationSelect: (coords: Coordinates) => void;
  onCancel: () => void;
  currentCoordinates?: Coordinates;
}

// Leaflet's default icon paths
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect, onCancel, currentCoordinates }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const currentMarkerRef = useRef<Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(currentCoordinates || null);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return; // Should not happen if component is mounted
    }

    // Use currentCoordinates for initial setup only
    const initialMapPosition = currentCoordinates
      ? new LatLng(currentCoordinates.lat, currentCoordinates.lng)
      : new LatLng(20, 0); // Default to a general world view
    const initialZoomLevel = currentCoordinates ? 13 : 2;

    const map = L.map(mapContainerRef.current).setView(initialMapPosition, initialZoomLevel);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    if (currentCoordinates) {
      currentMarkerRef.current = L.marker(initialMapPosition).addTo(map);
    }

    const handleMapClick = (e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setSelectedLocation({ lat, lng }); // Update local state for selection confirmation

      if (currentMarkerRef.current) {
        currentMarkerRef.current.setLatLng(e.latlng);
      } else {
        currentMarkerRef.current = L.marker(e.latlng).addTo(map);
      }
      map.panTo(e.latlng);
    };

    map.on('click', handleMapClick);

    // Cleanup function
    return () => {
      map.off('click', handleMapClick); // Explicitly remove the listener
      map.remove();

      mapInstanceRef.current = null;
      currentMarkerRef.current = null;
    };
  }, []); // Empty dependency array: runs once on mount, cleanup on unmount.

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-picker-title"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl transform transition-all">
        <h2 id="map-picker-title" className="text-2xl font-semibold text-slate-800 mb-4">Select Location</h2>
        <p className="text-sm text-slate-600 mb-3">Click on the map to place a marker at your desired location.</p>
        <div ref={mapContainerRef} style={{ height: '400px', width: '100%', borderRadius: '8px', marginBottom: '1rem' }} aria-label="Interactive map for location selection"></div>
        {selectedLocation && (
          <p className="text-sm text-sky-600 mb-4">
            Selected: Latitude: {selectedLocation.lat.toFixed(5)}, Longitude: {selectedLocation.lng.toFixed(5)}
          </p>
        )}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="px-5 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;