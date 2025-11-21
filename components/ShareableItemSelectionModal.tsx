import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MemoryEntry, ChronicleEvent, ImageFile } from '../types';
import { formatDateTimeForDisplay } from '../utils/dateUtils';
import clsx from 'clsx';

interface ShareableItem {
  id: string;
  title: string;
  date: string;
  image?: ImageFile | null;
}

interface ShareableItemSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (id: string, title: string, type: 'memory' | 'chronicle') => void;
  memories: MemoryEntry[];
  chronicles: ChronicleEvent[];
}

const ItemList: React.FC<{
  items: ShareableItem[];
  onSelect: (id: string, title: string) => void;
  itemTypeName: string;
}> = ({ items, onSelect, itemTypeName }) => {
  if (items.length === 0) {
    return <p className="text-slate-500 text-center py-8">{`هیچ ${itemTypeName}ی برای ارسال وجود ندارد.`}</p>;
  }

  return (
    <ul className="space-y-1">
      {items.map(item => (
        <li key={item.id}>
          <button
            onClick={() => onSelect(item.id, item.title)}
            className="w-full flex items-center p-2 text-right rounded-md hover:bg-sky-50 focus-within:bg-sky-100 transition-colors"
          >
            {item.image ? (
                <img src={item.image.dataUrl} alt={item.title} className="w-12 h-12 rounded-md object-cover mr-3 flex-shrink-0" />
            ) : (
                <span className="w-12 h-12 rounded-md bg-slate-200 flex items-center justify-center text-slate-400 text-xl mr-3 flex-shrink-0">
                    <i className={clsx("fas", itemTypeName === 'خاطره سفر' ? 'fa-route' : 'fa-calendar-day')}></i>
                </span>
            )}
            <div className="flex-grow min-w-0">
              <p className="font-semibold text-sm text-slate-800 truncate">{item.title}</p>
              <p className="text-xs text-slate-500">{formatDateTimeForDisplay(item.date, { showTime: false })}</p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
};


const ShareableItemSelectionModal: React.FC<ShareableItemSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectItem,
  memories,
  chronicles,
}) => {
  const [activeTab, setActiveTab] = useState<'memory' | 'chronicle'>('memory');
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setActiveTab('memory');
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

  const formattedMemories: ShareableItem[] = useMemo(() => memories.map(m => ({
    id: m.id,
    title: m.title,
    date: m.eventDate,
    image: m.images.length > 0 ? m.images[0] : undefined
  })), [memories]);

  const formattedChronicles: ShareableItem[] = useMemo(() => chronicles.map(c => ({
    id: c.id,
    title: c.title,
    date: c.eventDate,
    image: c.image
  })), [chronicles]);


  const filteredItems = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const source = activeTab === 'memory' ? formattedMemories : formattedChronicles;
    return source
      .filter(item => item.title.toLowerCase().includes(lowerSearch))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [searchTerm, activeTab, formattedMemories, formattedChronicles]);

  const handleSelect = (id: string, title: string) => {
    onSelectItem(id, title, activeTab);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[120] p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-item-selection-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col transform transition-all text-right"
      >
        <header className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 id="share-item-selection-title" className="text-lg font-semibold text-slate-700">
            <i className="fas fa-book-medical mr-2 text-purple-500"></i>ارسال خاطره یا رویداد
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-xl focus:outline-none focus:ring-1 focus:ring-sky-400 rounded-full p-1"
            aria-label="بستن"
          >
            <i className="fas fa-times"></i>
          </button>
        </header>
        
        <div className="border-b border-slate-200 px-2 pt-2">
            <div className="flex">
                <button
                    onClick={() => setActiveTab('memory')}
                    className={clsx('flex-1 py-2 px-4 text-sm font-semibold text-center rounded-t-md focus:outline-none focus:ring-1 focus:ring-inset focus:ring-sky-400', 
                        activeTab === 'memory' ? 'bg-white text-sky-600 border-b-2 border-sky-500' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    )}
                >
                    <i className="fas fa-route mr-1.5"></i>خاطرات سفر
                </button>
                <button
                    onClick={() => setActiveTab('chronicle')}
                    className={clsx('flex-1 py-2 px-4 text-sm font-semibold text-center rounded-t-md focus:outline-none focus:ring-1 focus:ring-inset focus:ring-emerald-400',
                        activeTab === 'chronicle' ? 'bg-white text-emerald-600 border-b-2 border-emerald-500' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    )}
                >
                    <i className="fas fa-calendar-day mr-1.5"></i>رویدادهای روزنگار
                </button>
            </div>
        </div>

        <div className="p-4 border-b border-slate-200">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`جستجو در میان ${activeTab === 'memory' ? 'خاطرات سفر' : 'رویدادها'}...`}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
            autoFocus
          />
        </div>

        <div className="flex-grow overflow-y-auto p-2">
          {filteredItems.length > 0 ? (
            <ItemList 
                items={filteredItems}
                onSelect={handleSelect}
                itemTypeName={activeTab === 'memory' ? 'خاطره سفر' : 'رویداد روزنگار'}
            />
          ) : (
            <p className="text-slate-500 text-center py-8">
                نتیجه‌ای برای جستجو یافت نشد.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareableItemSelectionModal;
