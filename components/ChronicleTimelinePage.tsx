
import React, { useState, useEffect } from 'react';
import { User, ChronicleEvent, ChronicleSearchCriteria } from '../types';
import ChronicleSearchFilters from './ChronicleSearchFilters';
import { formatDateTimeForDisplay } from '../utils/dateUtils';

interface ChronicleTimelinePageProps {
  currentUser: User;
  allChronicleEvents: ChronicleEvent[];
  onViewEventDetails: (event: ChronicleEvent) => void;
}

const ChronicleTimelinePage: React.FC<ChronicleTimelinePageProps> = ({ currentUser, allChronicleEvents, onViewEventDetails }) => {
  const [searchCriteria, setSearchCriteria] = useState<ChronicleSearchCriteria | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<ChronicleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    let events = [...allChronicleEvents];

    if (searchCriteria) {
      events = events.filter(event => {
        if (searchCriteria.text) {
          const searchText = searchCriteria.text.toLowerCase();
          const titleMatch = event.title.toLowerCase().includes(searchText);
          const descriptionMatch = event.description?.toLowerCase().includes(searchText) || false;
          if (!titleMatch && !descriptionMatch) return false;
        }
        if (searchCriteria.eventDateStart) {
          if (new Date(event.eventDate).setHours(0, 0, 0, 0) < new Date(searchCriteria.eventDateStart).setHours(0, 0, 0, 0)) return false;
        }
        if (searchCriteria.eventDateEnd) {
          if (new Date(event.eventDate).setHours(0, 0, 0, 0) > new Date(searchCriteria.eventDateEnd).setHours(0, 0, 0, 0)) return false;
        }
        if (searchCriteria.createdAtStart) {
          if (new Date(event.createdAt).setHours(0, 0, 0, 0) < new Date(searchCriteria.createdAtStart).setHours(0, 0, 0, 0)) return false;
        }
        if (searchCriteria.createdAtEnd) {
          if (new Date(event.createdAt).setHours(0, 0, 0, 0) > new Date(searchCriteria.createdAtEnd).setHours(0, 0, 0, 0)) return false;
        }
        return true;
      });
    }

    setFilteredEvents(events.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()));
    setIsLoading(false);
  }, [allChronicleEvents, searchCriteria]);

  const handleApplySearch = (criteria: ChronicleSearchCriteria) => {
    setSearchCriteria(criteria);
  };

  const handleResetSearch = () => {
    setSearchCriteria(null);
  };

  return (
    <div className="py-6">
      <div className="bg-white bg-opacity-90 p-6 rounded-xl shadow-xl mb-8 text-right">
        <h2 className="text-3xl font-semibold text-slate-800 mb-2">
          <i className="fas fa-stream ml-3 text-cyan-500"></i>خط زمانی روزنگار
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          تمام رویدادهای روزنگار خود (شخصی و اشتراک گذاشته شده) را در یکجا مشاهده و جستجو کنید.
        </p>
        <ChronicleSearchFilters
          onApplyFilters={handleApplySearch}
          onResetFilters={handleResetSearch}
          initialCriteria={searchCriteria}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-10"><i className="fas fa-spinner fa-spin text-4xl text-sky-500"></i><p className="mt-2 text-slate-100">در حال بارگذاری...</p></div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white bg-opacity-80 p-8 rounded-xl shadow-lg text-center">
            {searchCriteria ? (
                <>
                    <i className="fas fa-search-minus text-5xl text-slate-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-slate-700">نتیجه‌ای یافت نشد</h3>
                    <p className="text-slate-500 mt-2">هیچ رویدادی با معیارهای جستجوی شما مطابقت ندارد.</p>
                </>
            ) : (
                <>
                    <i className="fas fa-calendar-times text-5xl text-slate-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-slate-700">هنوز رویدادی ثبت نشده است</h3>
                    <p className="text-slate-500 mt-2">به بخش "روزنگار" بروید و اولین رویداد خود را ثبت کنید.</p>
                </>
            )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map(event => (
            <div
              key={event.id}
              className="bg-white bg-opacity-95 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border-r-4 border-emerald-400"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {event.image && (
                  <div className="flex-shrink-0 w-full sm:w-28 h-28">
                    <img src={event.image.dataUrl} alt={event.title} className="w-full h-full object-cover rounded-md" />
                  </div>
                )}
                <div className="flex-grow">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-lg font-bold text-emerald-800">{event.title}</h4>
                    <span className="text-sm font-medium text-slate-600">{formatDateTimeForDisplay(event.eventDate, { showTime: false })}</span>
                  </div>
                  {event.userId !== currentUser.id && (
                      <p className="text-xs text-slate-500 mb-2">اشتراک گذاشته شده توسط کاربر دیگر</p>
                  )}
                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap break-words">{event.description}</p>
                   <button 
                        onClick={() => onViewEventDetails(event)}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-800 mt-2"
                    >
                        مشاهده جزئیات <i className="fas fa-arrow-left text-xs"></i>
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChronicleTimelinePage;
