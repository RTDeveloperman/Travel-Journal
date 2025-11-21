
import React, { useState, useEffect, useMemo } from 'react';
import { User, HistoricalEvent, MemoryEntry, ChronicleEvent } from '../types';
import { generateHistoricalEventsTour } from '../services/geminiService';

interface EventsTourProps {
  currentUser: User;
  onCloseTour: () => void;
  setError: (error: string | null) => void;
  userMemories: MemoryEntry[];
  userChronicleEvents: ChronicleEvent[];
}

const extractYearFromString = (yearString: string): number | null => {
  if (!yearString) return null;
  const match = yearString.match(/\b(\d{4})\b/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  const persianMatch = yearString.match(/\b(۱۳\d{2}|۱۴\d{2})\b/);
  if (persianMatch && persianMatch[1]) {
    const pYear = parseInt(persianMatch[1], 10);
    if (pYear >= 1300 && pYear < 1500) {
        return pYear + 621; 
    }
  }
  return null;
};

const getSortableDate = (event: HistoricalEvent): Date | number => {
    if (event.isPersonal && event.eventDateFull) {
      const d = new Date(event.eventDateFull);
      if (!isNaN(d.getTime())) return d;
    }
    const year = extractYearFromString(event.eventYearOrPeriod);
    return year || Infinity; 
};

const sortEventsChronologically = (events: HistoricalEvent[]): HistoricalEvent[] => {
  return events.sort((a, b) => {
    const dateA = getSortableDate(a);
    const dateB = getSortableDate(b);

    if (dateA instanceof Date && dateB instanceof Date) {
      return dateA.getTime() - dateB.getTime();
    }
    if (typeof dateA === 'number' && typeof dateB === 'number') {
      return dateA - dateB;
    }
    if (dateA instanceof Date) return -1; 
    if (dateB instanceof Date) return 1;
    
    return 0; 
  });
};


const EventsTour: React.FC<EventsTourProps> = ({ 
    currentUser, 
    onCloseTour, 
    setError,
    userMemories,
    userChronicleEvents
}) => {
  const [geminiFetchedEvents, setGeminiFetchedEvents] = useState<HistoricalEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const [availablePersianCategories, setAvailablePersianCategories] = useState<string[]>([]);
  const [selectedPersianCategories, setSelectedPersianCategories] = useState<string[]>([]);

  const hasPersonalEventsToShow = useMemo(() => {
    const hasMemoriesToTour = userMemories.some(mem => mem.includeInEventsTour);
    const hasChroniclesToTour = userChronicleEvents.some(event => event.includeInEventsTour);
    return hasMemoriesToTour || hasChroniclesToTour;
  }, [userMemories, userChronicleEvents]);

  useEffect(() => {
    const fetchAndPrepareEvents = async () => {
        setIsLoading(true);
        setLocalError(null);
        setError(null); // Clear parent error as well

        let fetchedGeminiData: HistoricalEvent[] = [];
        
        const canFetchPublicEvents = process.env.API_KEY && currentUser.country;

        if (canFetchPublicEvents) {
            try {
                fetchedGeminiData = await generateHistoricalEventsTour(currentUser.country!, currentUser.dateOfBirth);
            } catch (e: any) {
                console.error("EventsTour Gemini fetch error:", e);
                const errorMessage = e.message || "خطا در دریافت وقایع تاریخی از هوش مصنوعی.";
                // Show error, but still proceed to show personal events if available
                setLocalError(`خطا در بارگذاری وقایع عمومی: ${errorMessage}${hasPersonalEventsToShow ? " وقایع شخصی همچنان نمایش داده می‌شوند." : ""}`);
            }
        } else {
            // Conditions for not fetching public events are handled by JSX messages if no personal events either
        }
        
        setGeminiFetchedEvents(fetchedGeminiData);
        setIsLoading(false);
    };

    fetchAndPrepareEvents();
  }, [currentUser.country, currentUser.dateOfBirth, currentUser.id, userMemories, userChronicleEvents, setError, hasPersonalEventsToShow]);


  const combinedAndFilteredEvents = useMemo(() => {
    const personalHistoricalEvents: HistoricalEvent[] = [];

    userMemories.forEach(mem => {
        if (mem.includeInEventsTour) {
            personalHistoricalEvents.push({
                originalId: mem.id,
                title: mem.title,
                description: mem.description.substring(0, 150) + (mem.description.length > 150 ? "..." : ""),
                eventYearOrPeriod: mem.eventDate.substring(0, 4), 
                eventDateFull: mem.eventDate, 
                category: 'personal',
                persianCategory: "خاطره سفر",
                isPersonal: true,
            });
        }
    });

    userChronicleEvents.forEach(event => {
        if (event.includeInEventsTour) {
            personalHistoricalEvents.push({
                originalId: event.id,
                title: event.title,
                description: event.description.substring(0, 150) + (event.description.length > 150 ? "..." : ""),
                eventYearOrPeriod: event.eventDate.substring(0, 4),
                eventDateFull: event.eventDate,
                category: 'personal',
                persianCategory: "رویداد روزنگار",
                isPersonal: true,
            });
        }
    });
    
    let allEvents = [...geminiFetchedEvents, ...personalHistoricalEvents];

    if (currentUser.dateOfBirth) {
      const birthYear = parseInt(currentUser.dateOfBirth.split('-')[0], 10);
      if (!isNaN(birthYear)) {
        allEvents = allEvents.filter(event => {
          const eventYear = extractYearFromString(event.eventYearOrPeriod);
          if (event.isPersonal && event.eventDateFull) {
            return new Date(event.eventDateFull) >= new Date(currentUser.dateOfBirth!);
          }
          return eventYear ? eventYear >= birthYear : true; 
        });
      }
    }
    
    const uniqueCategories = Array.from(new Set(allEvents.map(event => event.persianCategory).filter(Boolean)));
    const sortedUniqueCategories = uniqueCategories.sort((a,b)=>a.localeCompare(b,'fa'));

    if (JSON.stringify(sortedUniqueCategories) !== JSON.stringify(availablePersianCategories)) {
        setTimeout(() => setAvailablePersianCategories(sortedUniqueCategories), 0);
    }

    if (selectedPersianCategories.length > 0) {
      allEvents = allEvents.filter(event => 
        selectedPersianCategories.includes(event.persianCategory)
      );
    }
    
    return sortEventsChronologically(allEvents);
  }, [geminiFetchedEvents, userMemories, userChronicleEvents, currentUser.dateOfBirth, selectedPersianCategories, availablePersianCategories]);


  const handleCategoryToggle = (persianCategory: string) => {
    setSelectedPersianCategories(prev =>
      prev.includes(persianCategory)
        ? prev.filter(cat => cat !== persianCategory)
        : [...prev, persianCategory]
    );
  };
  
  const handleSelectAllCategories = () => {
    setSelectedPersianCategories([]); 
  };

  const getCategoryStyle = (category: 'country' | 'world' | 'general' | 'personal', isPersonal?: boolean) => {
    if (isPersonal || category === 'personal') {
         return {
          icon: 'fas fa-user-clock',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-700',
          label: 'رویداد شخصی',
        };
    }
    switch (category) {
      case 'country':
        return {
          icon: 'fas fa-flag',
          bgColor: 'bg-sky-50',
          borderColor: 'border-sky-500',
          textColor: 'text-sky-700',
          label: `وقایع ${currentUser.country || 'کشور'}`,
        };
      case 'world':
        return {
          icon: 'fas fa-globe-americas',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-500',
          textColor: 'text-emerald-700',
          label: 'وقایع جهان',
        };
      default: 
        return {
          icon: 'fas fa-landmark',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-500',
          textColor: 'text-slate-700',
          label: 'وقایع عمومی',
        };
    }
  };


  return (
    <div className="bg-white bg-opacity-95 p-6 rounded-xl shadow-xl text-right">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h2 className="text-3xl font-semibold text-slate-800">
          <i className="fas fa-route ml-3 text-purple-500"></i>تور وقایع من
        </h2>
        <button
          onClick={onCloseTour}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
        >
          <i className="fas fa-arrow-left ml-2"></i> بازگشت به روزنگار شخصی
        </button>
      </div>

      {/* Message if API key is missing, Gemini events couldn't be fetched, AND no personal events exist */}
      {!isLoading && !process.env.API_KEY && geminiFetchedEvents.length === 0 && !hasPersonalEventsToShow && (
         <div className="bg-yellow-100 border-r-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow-lg" role="alert">
          <p className="font-bold">پیکربندی ناقص</p>
          <p>کلید Gemini API برای بارگذاری وقایع عمومی ارائه نشده و هیچ رویداد شخصی نیز برای "تور وقایع" انتخاب نشده است. در نتیجه، توری برای نمایش وجود ندارد.</p>
        </div>
      )}
      {/* Message if country is missing (but API key IS present), Gemini events couldn't be fetched, AND no personal events exist */}
       {!isLoading && !currentUser.country && process.env.API_KEY && geminiFetchedEvents.length === 0 && !hasPersonalEventsToShow && (
         <div className="bg-orange-100 border-r-4 border-orange-500 text-orange-700 p-4 mb-6 rounded-md shadow-lg" role="alert">
          <p className="font-bold">پیکربندی ناقص</p>
          <p>کشور کاربر برای بارگذاری وقایع عمومی مشخص نشده و هیچ رویداد شخصی نیز برای "تور وقایع" انتخاب نشده است. در نتیجه، توری برای نمایش وجود ندارد.</p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-10">
          <i className="fas fa-spinner fa-spin text-5xl text-purple-500"></i>
          <p className="mt-3 text-lg text-slate-600">در حال دریافت وقایع...</p>
          {currentUser.dateOfBirth && <p className="text-sm text-slate-500">وقایع از تاریخ تولد شما ({currentUser.dateOfBirth.split('-')[0]}) به بعد در نظر گرفته می‌شوند.</p>}
        </div>
      )}

      {/* Shows if Gemini fetch failed, regardless of personal events */}
      {localError && ( 
        <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-lg" role="alert">
          <p className="font-bold">خطا</p>
          <p>{localError}</p>
        </div>
      )}
      
      {/* This condition for "no events found" should be after loading and after checking critical config errors */}
      {!isLoading && !localError && combinedAndFilteredEvents.length === 0 && 
       ( (process.env.API_KEY && currentUser.country) || hasPersonalEventsToShow) && /* Only show this if some events *could* have been fetched/shown */
        (
        <div className="text-center py-10">
          <i className="fas fa-history text-5xl text-slate-400"></i>
          <p className="mt-3 text-lg text-slate-600">
            هیچ رویدادی (عمومی یا شخصی) برای نمایش مطابق با معیارهای شما یافت نشد.
          </p>
          {!(process.env.API_KEY && currentUser.country) && hasPersonalEventsToShow && 
            <p className="text-sm text-slate-500 mt-1">وقایع عمومی به دلیل عدم تنظیم کلید API یا کشور کاربر، بارگذاری نشدند.</p>
          }
        </div>
      )}
      
      {!isLoading && !localError && combinedAndFilteredEvents.length > 0 && (
        <>
          {availablePersianCategories.length > 0 && (
            <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
              <h4 className="text-md font-semibold text-slate-700 mb-3">فیلتر بر اساس دسته‌بندی موضوعی:</h4>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={handleSelectAllCategories}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                              ${selectedPersianCategories.length === 0 ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                >
                  همه دسته‌بندی‌ها
                </button>
                {availablePersianCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryToggle(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                                ${selectedPersianCategories.includes(cat) ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {combinedAndFilteredEvents.length === 0 && selectedPersianCategories.length > 0 && ( 
            <div className="text-center py-6">
                <i className="fas fa-filter-circle-xmark text-4xl text-slate-400 mb-3"></i>
                <p className="text-slate-600">هیچ رویدادی با دسته‌بندی(های) انتخاب شده یافت نشد.</p>
            </div>
          )}

          <div className="space-y-6">
            {currentUser.dateOfBirth && <p className="text-sm text-slate-600 mb-4 text-center">نمایش وقایع از سال تولد شما ({currentUser.dateOfBirth.split('-')[0]}) به بعد:</p>}
            {combinedAndFilteredEvents.map((event, index) => {
              const style = getCategoryStyle(event.category, event.isPersonal);
              const displayDate = event.isPersonal && event.eventDateFull 
                ? new Date(event.eventDateFull).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
                : event.eventYearOrPeriod;

              return (
                <div key={event.originalId || index} className={`p-5 rounded-lg border-r-4 ${style.borderColor} ${style.bgColor} shadow-md`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center flex-1 min-w-0"> {/* Flex-1 and min-w-0 for text wrapping */}
                        <i className={`${style.icon} ml-2 text-xl ${style.textColor} self-start mt-1`}></i>
                        <h3 className={`text-xl font-semibold ${style.textColor} break-words`}>{event.title}</h3>
                    </div>
                    {event.persianCategory && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${event.isPersonal ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-700'} flex-shrink-0 ml-2`}>
                            {event.persianCategory}
                        </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    <i className="fas fa-calendar-alt ml-1"></i>تاریخ/دوره: {displayDate}
                  </p>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{event.description}</p>
                   <p className={`mt-2 text-xs font-semibold ${style.textColor} opacity-80`}>{style.label}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default EventsTour;
