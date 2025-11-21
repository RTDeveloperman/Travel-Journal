
import React, { useState, useEffect, useRef, useMemo } from 'react';

interface GifPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGifSelect: (gifUrl: string) => void;
}

// Sample GIFs (replace with actual URLs or a more dynamic source if possible)
const sampleGifs = [
  { id: '1', name: 'Dancing Banana', url: 'https://media.giphy.com/media/Vh8pbGX3SGRwA/giphy.gif', tags: ['dancing', 'happy', 'banana'] },
  { id: '2', name: 'Cat Typing', url: 'https://media.giphy.com/media/o0vwzuFklcNaU/giphy.gif', tags: ['cat', 'typing', 'work', 'computer'] },
  { id: '3', name: 'Happy Minion', url: 'https://media.giphy.com/media/1MTLxzwvOnvmE/giphy.gif', tags: ['minion', 'happy', 'excited'] },
  { id: '4', name: 'Facepalm Picard', url: 'https://media.giphy.com/media/6OWIl75M4up1kCNxV2/giphy.gif', tags: ['facepalm', 'picard', 'star trek', 'fail'] },
  { id: '5', name: 'Thumbs Up', url: 'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif', tags: ['thumbs up', 'ok', 'good job'] },
  { id: '6', name: 'Popcorn', url: 'https://media.giphy.com/media/NipFetnQOuKhW/giphy.gif', tags: ['popcorn', 'watching', 'drama'] },
  { id: '7', name: 'Excited Spongebob', url: 'https://media.giphy.com/media/sfh02yN2H074s/giphy.gif', tags: ['spongebob', 'excited', 'happy'] },
  { id: '8', name: 'Confused Travolta', url: 'https://media.giphy.com/media/3o7aTskHEUdgCQAXde/giphy.gif', tags: ['confused', 'travolta', 'lost'] },
  { id: '9', name: 'Deal With It Dog', url: 'https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif', tags: ['deal with it', 'dog', 'sunglasses', 'cool'] },
  { id: '10', name: 'Slow Clap', url: 'https://media.giphy.com/media/2mxA3QHH4aTE4/giphy.gif', tags: ['clap', 'slow clap', 'sarcastic', 'applause'] },
  { id: '11', name: 'Shrug', url: 'https://media.giphy.com/media/3o7buirYppOJdKJN0A/giphy.gif', tags: ['shrug', 'whatever', 'dont know'] },
  { id: '12', name: 'Mind Blown', url: 'https://media.giphy.com/media/2rqEdFfkMzXmo/giphy.gif', tags: ['mind blown', 'explosion', 'wow'] },
];


const GifPickerModal: React.FC<GifPickerModalProps> = ({ isOpen, onClose, onGifSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm(''); // Reset search on open
      searchInputRef.current?.focus();
    }
  }, [isOpen]);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && event.target === modalRef.current.parentElement) onClose();
  };

  const displayedGifs = useMemo(() => {
    if (!searchTerm.trim()) return sampleGifs;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return sampleGifs.filter(gif => 
      gif.name.toLowerCase().includes(lowerSearchTerm) || 
      gif.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
    );
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4" // Higher z-index
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gif-picker-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col transform transition-all text-right"
      >
        <header className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
          <h2 id="gif-picker-title" className="text-lg font-semibold text-slate-700">
            <i className="fas fa-photo-video ml-2 text-sky-500"></i>انتخاب گیف
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-xl focus:outline-none focus:ring-1 focus:ring-sky-400 rounded-full p-1"
            aria-label="بستن انتخابگر گیف"
          >
            <i className="fas fa-times"></i>
          </button>
        </header>

        <div className="p-4 border-b border-slate-200">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی گیف (مثال: happy, cat, dance)..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
           <p className="text-xs text-slate-400 mt-1 text-center">توجه: جستجو در این نسخه نمایشی محدود به گیف‌های نمونه است.</p>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          {displayedGifs.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {displayedGifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => onGifSelect(gif.url)}
                  className="aspect-square bg-slate-100 rounded-md overflow-hidden hover:ring-2 hover:ring-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  aria-label={`انتخاب گیف: ${gif.name}`}
                >
                  <img 
                    src={gif.url} 
                    alt={gif.name} 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-6">
              هیچ گیفی مطابق با جستجوی شما یافت نشد.
            </p>
          )}
        </div>
        <footer className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end sticky bottom-0 z-10 rounded-b-xl">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none"
            >
                بستن
            </button>
        </footer>
      </div>
    </div>
  );
};

export default GifPickerModal;
