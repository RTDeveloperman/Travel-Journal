
import React, { useState, useEffect } from 'react';
import { ChronicleSearchCriteria } from '../types';

interface ChronicleSearchFiltersProps {
  onApplyFilters: (criteria: ChronicleSearchCriteria) => void;
  onResetFilters: () => void;
  initialCriteria: ChronicleSearchCriteria | null;
}

const ChronicleSearchFilters: React.FC<ChronicleSearchFiltersProps> = ({
  onApplyFilters,
  onResetFilters,
  initialCriteria,
}) => {
  const [text, setText] = useState('');
  const [eventDateStart, setEventDateStart] = useState('');
  const [eventDateEnd, setEventDateEnd] = useState('');
  const [createdAtStart, setCreatedAtStart] = useState('');
  const [createdAtEnd, setCreatedAtEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (initialCriteria) {
      setText(initialCriteria.text || '');
      setEventDateStart(initialCriteria.eventDateStart || '');
      setEventDateEnd(initialCriteria.eventDateEnd || '');
      setCreatedAtStart(initialCriteria.createdAtStart || '');
      setCreatedAtEnd(initialCriteria.createdAtEnd || '');
      setShowFilters(true);
    }
  }, [initialCriteria]);

  const handleReset = () => {
    setText('');
    setEventDateStart('');
    setEventDateEnd('');
    setCreatedAtStart('');
    setCreatedAtEnd('');
    onResetFilters();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const criteria: ChronicleSearchCriteria = {
      text: text.trim() || undefined,
      eventDateStart: eventDateStart || undefined,
      eventDateEnd: eventDateEnd || undefined,
      createdAtStart: createdAtStart || undefined,
      createdAtEnd: createdAtEnd || undefined,
    };
    onApplyFilters(criteria);
  };
  
  const hasActiveFilters = () => {
      return text || eventDateStart || eventDateEnd || createdAtStart || createdAtEnd;
  }

  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <button onClick={() => setShowFilters(prev => !prev)} className="font-semibold text-slate-700 w-full text-right flex justify-between items-center">
            <span>
                <i className="fas fa-search mr-2 text-cyan-600"></i>
                جستجوی پیشرفته
            </span>
            <i className={`fas transition-transform ${showFilters ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
        </button>

        {showFilters && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4 animate-fade-in-down">
                <div>
                  <label htmlFor="chronicleSearchText" className="block text-sm font-medium text-slate-600 mb-1">
                    جستجو در تیتر و شرح
                  </label>
                  <input
                    type="text"
                    id="chronicleSearchText"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-900"
                    placeholder="کلمه کلیدی..."
                  />
                </div>

                <fieldset className="border border-slate-300 p-3 rounded-md">
                  <legend className="text-sm font-medium text-slate-700 px-2">محدوده تاریخ رویداد</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label htmlFor="eventDateStart" className="block text-xs font-medium text-slate-600 mb-1">از</label>
                      <input type="date" id="eventDateStart" value={eventDateStart} onChange={(e) => setEventDateStart(e.target.value)} className="mt-1 block w-full text-slate-900"/>
                    </div>
                    <div>
                      <label htmlFor="eventDateEnd" className="block text-xs font-medium text-slate-600 mb-1">تا</label>
                      <input type="date" id="eventDateEnd" value={eventDateEnd} onChange={(e) => setEventDateEnd(e.target.value)} className="mt-1 block w-full text-slate-900"/>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border border-slate-300 p-3 rounded-md">
                  <legend className="text-sm font-medium text-slate-700 px-2">محدوده تاریخ ثبت</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label htmlFor="createdAtStart" className="block text-xs font-medium text-slate-600 mb-1">از</label>
                      <input type="date" id="createdAtStart" value={createdAtStart} onChange={(e) => setCreatedAtStart(e.target.value)} className="mt-1 block w-full text-slate-900"/>
                    </div>
                    <div>
                      <label htmlFor="createdAtEnd" className="block text-xs font-medium text-slate-600 mb-1">تا</label>
                      <input type="date" id="createdAtEnd" value={createdAtEnd} onChange={(e) => setCreatedAtEnd(e.target.value)} className="mt-1 block w-full text-slate-900"/>
                    </div>
                  </div>
                </fieldset>
                
                <div className="flex items-center justify-start space-x-4 space-x-reverse pt-3 border-t border-slate-200">
                  {hasActiveFilters() && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300"
                    >
                        پاک کردن فیلترها
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700"
                  >
                    اعمال فیلترها
                  </button>
                </div>
            </form>
        )}
    </div>
  );
};

export default ChronicleSearchFilters;
