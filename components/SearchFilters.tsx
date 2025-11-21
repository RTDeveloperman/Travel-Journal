
import React, { useState, useEffect } from 'react';
import { Companion, SearchCriteria, MapBoundsCoordinates } from '../types';
import { splitISOToDateAndTime } from '../utils/dateUtils'; // For potential default date display

interface SearchFiltersProps {
  companionsList: Companion[];
  onApplyFilters: (criteria: SearchCriteria) => void;
  onResetFilters: () => void;
  onClose: () => void;
  onShowMapBoundsSelector: () => void;
  currentMapBounds: MapBoundsCoordinates | null;
  initialCriteria: SearchCriteria | null;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ 
  companionsList, 
  onApplyFilters, 
  onResetFilters, 
  onClose, 
  onShowMapBoundsSelector,
  currentMapBounds,
  initialCriteria
}) => {
  const [text, setText] = useState('');
  const [eventDateStart, setEventDateStart] = useState('');
  const [eventDateEnd, setEventDateEnd] = useState('');
  const [createdAtStart, setCreatedAtStart] = useState('');
  const [createdAtEnd, setCreatedAtEnd] = useState('');
  const [selectedCompanions, setSelectedCompanions] = useState<string[]>([]);
  
  // Use currentMapBounds from props to reflect selection made via modal
  // This local state is mostly for knowing *if* a bound was part of the criteria that's being built
  const [mapBoundsForCriteria, setMapBoundsForCriteria] = useState<MapBoundsCoordinates | null>(null);

  useEffect(() => {
    if (initialCriteria) {
      setText(initialCriteria.text || '');
      setEventDateStart(initialCriteria.eventDateStart || '');
      setEventDateEnd(initialCriteria.eventDateEnd || '');
      setCreatedAtStart(initialCriteria.createdAtStart || '');
      setCreatedAtEnd(initialCriteria.createdAtEnd || '');
      setSelectedCompanions(initialCriteria.companions || []);
      setMapBoundsForCriteria(initialCriteria.mapBounds || null);
    } else {
      // Reset local fields if initialCriteria is null (e.g. after a global reset)
      setText('');
      setEventDateStart('');
      setEventDateEnd('');
      setCreatedAtStart('');
      setCreatedAtEnd('');
      setSelectedCompanions([]);
      setMapBoundsForCriteria(null);
    }
  }, [initialCriteria]);
  
  // Update local map bounds state when the prop changes (after selection from modal)
  useEffect(() => {
    setMapBoundsForCriteria(currentMapBounds);
  }, [currentMapBounds]);


  const handleCompanionToggle = (companionId: string) => {
    setSelectedCompanions(prev =>
      prev.includes(companionId)
        ? prev.filter(id => id !== companionId)
        : [...prev, companionId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const criteria: SearchCriteria = {
      text: text.trim() || undefined,
      eventDateStart: eventDateStart || undefined,
      eventDateEnd: eventDateEnd || undefined,
      createdAtStart: createdAtStart || undefined,
      createdAtEnd: createdAtEnd || undefined,
      companions: selectedCompanions.length > 0 ? selectedCompanions : undefined,
      mapBounds: mapBoundsForCriteria || undefined,
    };
    onApplyFilters(criteria);
  };

  const handleReset = () => {
    setText('');
    setEventDateStart('');
    setEventDateEnd('');
    setCreatedAtStart('');
    setCreatedAtEnd('');
    setSelectedCompanions([]);
    setMapBoundsForCriteria(null); // Clear local map bounds
    onResetFilters(); // This will also clear currentSearchMapBounds in App.tsx via its own logic
  };

  return (
    <div className="bg-white bg-opacity-95 p-6 sm:p-8 rounded-xl shadow-2xl transform transition-all duration-300 ease-in-out">
      <form onSubmit={handleSubmit} className="space-y-6 text-right">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">
            <i className="fas fa-filter ml-2 text-indigo-500"></i>فیلتر و جستجوی خاطرات
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-xl focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-full p-1"
            aria-label="بستن فرم جستجو"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Text Search */}
        <div>
          <label htmlFor="searchText" className="block text-sm font-medium text-slate-700 mb-1">
            <i className="fas fa-search ml-1"></i>جستجو در متن (عنوان، مکان، توضیحات)
          </label>
          <input
            type="text"
            id="searchText"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-900"
            placeholder="مثال: پاریس، ساحل، موزه"
          />
        </div>

        {/* Event Date Range */}
        <fieldset className="border border-slate-300 p-4 rounded-md">
          <legend className="text-sm font-medium text-slate-700 px-2">
            <i className="fas fa-calendar-day ml-1"></i>محدوده تاریخ رویداد
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label htmlFor="eventDateStart" className="block text-xs font-medium text-slate-600 mb-1">از تاریخ</label>
              <input type="date" id="eventDateStart" value={eventDateStart} onChange={(e) => setEventDateStart(e.target.value)} className="mt-1 block w-full text-slate-900"/>
            </div>
            <div>
              <label htmlFor="eventDateEnd" className="block text-xs font-medium text-slate-600 mb-1">تا تاریخ</label>
              <input type="date" id="eventDateEnd" value={eventDateEnd} onChange={(e) => setEventDateEnd(e.target.value)} className="mt-1 block w-full text-slate-900"/>
            </div>
          </div>
        </fieldset>

        {/* Created At Date Range */}
        <fieldset className="border border-slate-300 p-4 rounded-md">
          <legend className="text-sm font-medium text-slate-700 px-2">
            <i className="fas fa-calendar-plus ml-1"></i>محدوده تاریخ ثبت
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label htmlFor="createdAtStart" className="block text-xs font-medium text-slate-600 mb-1">از تاریخ</label>
              <input type="date" id="createdAtStart" value={createdAtStart} onChange={(e) => setCreatedAtStart(e.target.value)} className="mt-1 block w-full text-slate-900"/>
            </div>
            <div>
              <label htmlFor="createdAtEnd" className="block text-xs font-medium text-slate-600 mb-1">تا تاریخ</label>
              <input type="date" id="createdAtEnd" value={createdAtEnd} onChange={(e) => setCreatedAtEnd(e.target.value)} className="mt-1 block w-full text-slate-900"/>
            </div>
          </div>
        </fieldset>
        
        {/* Companions Filter */}
        {companionsList.length > 0 && (
          <fieldset className="border border-slate-300 p-4 rounded-md">
            <legend className="text-sm font-medium text-slate-700 px-2">
              <i className="fas fa-users ml-1"></i>فیلتر بر اساس همسفران
            </legend>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
              {companionsList.map(comp => (
                <label key={comp.id} htmlFor={`filter-comp-${comp.id}`} className="flex items-center space-x-2 cursor-pointer flex-row-reverse justify-end">
                  <span className="text-sm font-medium text-slate-800 mr-2">{comp.name}</span>
                  <input
                    type="checkbox"
                    id={`filter-comp-${comp.id}`}
                    checked={selectedCompanions.includes(comp.id)}
                    onChange={() => handleCompanionToggle(comp.id)}
                    className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                  />
                </label>
              ))}
            </div>
          </fieldset>
        )}
        
        {/* Map Bounds Filter */}
         <fieldset className="border border-slate-300 p-4 rounded-md">
            <legend className="text-sm font-medium text-slate-700 px-2">
                <i className="fas fa-map-marked-alt ml-1"></i>فیلتر بر اساس موقعیت مکانی
            </legend>
            <button
                type="button"
                onClick={onShowMapBoundsSelector}
                className="mt-2 mb-1 px-4 py-2 text-sm font-medium text-sky-600 bg-sky-100 rounded-md hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            >
                <i className="fas fa-map-pin ml-2"></i>انتخاب محدوده از روی نقشه
            </button>
            {mapBoundsForCriteria && (
                <div className="text-xs text-green-700 bg-green-50 p-2 rounded-md mt-2">
                    <p className="font-semibold"><i className="fas fa-check-circle ml-1"></i>محدوده جغرافیایی انتخاب شده:</p>
                    <p>جنوب غربی: {mapBoundsForCriteria.southWest.lat.toFixed(4)}, {mapBoundsForCriteria.southWest.lng.toFixed(4)}</p>
                    <p>شمال شرقی: {mapBoundsForCriteria.northEast.lat.toFixed(4)}, {mapBoundsForCriteria.northEast.lng.toFixed(4)}</p>
                     <button 
                        type="button" 
                        onClick={() => setMapBoundsForCriteria(null)} 
                        className="mt-1 text-red-500 hover:text-red-700 text-xs font-semibold"
                        aria-label="پاک کردن محدوده نقشه انتخاب شده"
                    >
                        (پاک کردن محدوده)
                    </button>
                </div>
            )}
        </fieldset>


        {/* Action Buttons */}
        <div className="flex items-center justify-start space-x-4 space-x-reverse pt-4 border-t border-slate-200 mt-6">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
          >
            <i className="fas fa-eraser ml-2"></i>پاک کردن همه فیلترها
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center justify-center min-w-[150px]"
          >
            <i className="fas fa-check-circle ml-2"></i>اعمال فیلترها
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchFilters;
