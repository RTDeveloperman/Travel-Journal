
import React, { useState, useEffect, useCallback } from 'react';
import { ChronicleEvent, User, ImageFile, MemoryEntry } from '../types';
import ChronicleEventForm from './ChronicleEventForm';
import ChronicleEventCard from './ChronicleEventCard';
import EventsTour from './EventsTour'; 
import { formatDateTimeForDisplay } from '../utils/dateUtils';


interface ChroniclePageProps {
  currentUser: User;
  events: ChronicleEvent[];
  onAddEvent: (eventData: Omit<ChronicleEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'sharedWith'>) => Promise<void>;
  onUpdateEvent: (eventData: ChronicleEvent) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
  isLoading: boolean;
  setError: (error: string | null) => void;
  userMemories: MemoryEntry[]; 
  onShareEvent: (id: string, title: string, type: 'memory' | 'chronicle', ownerUserId: string) => void; // For sharing
}

const ChroniclePage: React.FC<ChroniclePageProps> = ({
  currentUser,
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  isLoading: isAppLoading, 
  setError,
  userMemories, 
  onShareEvent,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<ChronicleEvent | null>(null);
  const [isFormLoading, setIsFormLoading] = useState<boolean>(false);
  const [showEventsTourView, setShowEventsTourView] = useState<boolean>(false); 

  const userDateOfBirth = currentUser.dateOfBirth ? currentUser.dateOfBirth.split('T')[0] : '0000-01-01'; 

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate < userDateOfBirth) {
      setError(`نمی‌توانید تاریخی قبل از تاریخ تولد خود (${formatDateTimeForDisplay(userDateOfBirth, {showTime:false})}) انتخاب کنید.`);
      setSelectedDate(userDateOfBirth); 
    } else {
      setSelectedDate(newDate);
      setError(null);
    }
    setShowEventForm(false); 
    setEditingEvent(null);
  };

  const eventsForSelectedDate = events.filter(event => event.eventDate === selectedDate);

  const handleAddEventSubmit = async (title: string, description: string, image: ImageFile | null, eventDate: string, includeInEventsTour?: boolean) => {
    if (eventDate < userDateOfBirth) {
        setError(`تاریخ رویداد نمی‌تواند قبل از تاریخ تولد شما باشد.`);
        return;
    }
    setIsFormLoading(true);
    setError(null);
    try {
      await onAddEvent({ eventDate, title, description, image, includeInEventsTour });
      setShowEventForm(false);
    } catch (e: any) {
      setError(e.message || "خطا در افزودن رویداد.");
    } finally {
      setIsFormLoading(false);
    }
  };
  
  const handleUpdateEventSubmit = async (id: string, title: string, description: string, image: ImageFile | null, eventDate: string, includeInEventsTour?: boolean) => {
    if (eventDate < userDateOfBirth) {
        setError(`تاریخ رویداد نمی‌تواند قبل از تاریخ تولد شما باشد.`);
        return;
    }
    setIsFormLoading(true);
    setError(null);
    const originalEvent = events.find(e => e.id === id);
    if (!originalEvent) {
        setError("رویداد اصلی برای بروزرسانی یافت نشد.");
        setIsFormLoading(false);
        return;
    }
    try {
      await onUpdateEvent({ 
          ...originalEvent, 
          title, 
          description, 
          image, 
          eventDate,
          includeInEventsTour,
          // sharedWith is preserved by App.tsx's update handler
      });
      setShowEventForm(false);
      setEditingEvent(null);
    } catch (e: any) {
      setError(e.message || "خطا در بروزرسانی رویداد.");
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleEditEvent = (event: ChronicleEvent) => {
    setEditingEvent(event);
    setSelectedDate(event.eventDate); 
    setShowEventForm(true);
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    // Confirmation is handled in ChronicleEventCard for shared items
    setIsFormLoading(true); 
    setError(null);
    try {
        await onDeleteEvent(eventId);
    } catch(e:any) {
        setError(e.message || "خطا در حذف رویداد.");
    } finally {
        setIsFormLoading(false);
    }
  };

  const handleToggleForm = () => {
    if (showEventForm && editingEvent) setEditingEvent(null);
    setShowEventForm(!showEventForm);
    if (!showEventForm) setEditingEvent(null); 
  };
  
  const handleCancelForm = () => {
      setShowEventForm(false);
      setEditingEvent(null);
  }

  const handleToggleEventsTourView = () => {
    setShowEventsTourView(prev => !prev);
    setShowEventForm(false); 
    setEditingEvent(null);
    setError(null); 
  };

  if (showEventsTourView) {
    return (
      <EventsTour 
        currentUser={currentUser} 
        onCloseTour={handleToggleEventsTourView} 
        setError={setError} 
        userMemories={userMemories} 
        userChronicleEvents={events} 
      />
    );
  }

  return (
    <div className="py-6">
      <div className="bg-white bg-opacity-90 p-6 rounded-xl shadow-xl mb-8 text-right">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <div>
                <h2 className="text-3xl font-semibold text-slate-800">
                <i className="fas fa-book-open ml-3 text-emerald-500"></i>روزنگار وقایع شخصی
                </h2>
                {currentUser.dateOfBirth && (
                    <p className="text-sm text-slate-600 mt-1">
                        تاریخ تولد شما: {formatDateTimeForDisplay(currentUser.dateOfBirth, { showTime: false})}
                    </p>
                )}
                 {currentUser.country && (
                    <p className="text-sm text-slate-600">
                        کشور شما: {currentUser.country}
                    </p>
                )}
            </div>
            <button
                onClick={handleToggleEventsTourView}
                className="w-full sm:w-auto mt-3 sm:mt-0 px-5 py-2.5 text-sm font-medium text-white bg-purple-500 rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors flex items-center justify-center"
            >
                <i className="fas fa-route ml-2"></i>تور وقایع من
            </button>
        </div>
       
        {!currentUser.dateOfBirth && (
            <p className="text-sm text-orange-600 bg-orange-100 p-3 rounded-md mb-4">
                <i className="fas fa-exclamation-triangle ml-2"></i>برای استفاده کامل از روزنگار، لطفاً از ادمین بخواهید تاریخ تولد شما را در پنل مدیریت ثبت کند.
            </p>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex-grow w-full sm:w-auto">
            <label htmlFor="chronicleDate" className="block text-sm font-medium text-slate-700 mb-1">
              مشاهده وقایع برای تاریخ:
            </label>
            <input
              type="date"
              id="chronicleDate"
              value={selectedDate}
              onChange={handleDateChange}
              min={userDateOfBirth} 
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-900"
            />
          </div>
          <button
            onClick={handleToggleForm}
            disabled={selectedDate < userDateOfBirth || isAppLoading}
            className="w-full sm:w-auto px-6 py-2.5 text-base font-semibold rounded-lg shadow-md transition-colors ease-in-out disabled:opacity-50 disabled:cursor-not-allowed
                       bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {showEventForm ? <><i className="fas fa-times mr-2"></i>بستن فرم</> : <><i className="fas fa-plus mr-2"></i>افزودن رویداد برای این روز</>}
          </button>
        </div>
      </div>

      {showEventForm && (
        <ChronicleEventForm
          key={editingEvent ? editingEvent.id : 'new'} 
          onSubmit={editingEvent ? 
            (title, description, image, eventDate, includeInEventsTour) => handleUpdateEventSubmit(editingEvent.id, title, description, image, eventDate, includeInEventsTour) : 
            handleAddEventSubmit
          }
          onCancel={handleCancelForm}
          isLoading={isFormLoading}
          initialData={editingEvent}
          eventDateFromPicker={selectedDate} 
          userDateOfBirth={userDateOfBirth}
        />
      )}
      
      {isAppLoading && events.length === 0 && <div className="text-center py-10"><i className="fas fa-spinner fa-spin text-4xl text-sky-500"></i><p className="mt-2 text-slate-100">در حال بارگذاری...</p></div>}

      {!isAppLoading && eventsForSelectedDate.length === 0 && !showEventForm && (
        <div className="bg-white bg-opacity-80 p-6 rounded-xl shadow-lg text-center">
          <i className="fas fa-calendar-times text-5xl text-slate-400 mb-4"></i>
          <h3 className="text-xl font-semibold text-slate-700">
            هیچ رویدادی برای {formatDateTimeForDisplay(selectedDate, {showTime:false})} ثبت نشده است.
          </h3>
          {selectedDate >= userDateOfBirth && 
            <p className="text-slate-500 mt-2">می‌توانید با کلیک روی دکمه "افزودن رویداد" اولین واقعه این روز را ثبت کنید.</p>
          }
        </div>
      )}

      {!isAppLoading && eventsForSelectedDate.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-white mb-4 text-center" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.7)'}}>
            وقایع ثبت شده برای {formatDateTimeForDisplay(selectedDate, {showTime:false})} ({eventsForSelectedDate.length} مورد)
          </h3>
          {eventsForSelectedDate.map(event => (
            <ChronicleEventCard
              key={event.id}
              event={event}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              isLoading={isFormLoading && editingEvent?.id === event.id} 
              currentUser={currentUser}
              onShare={onShareEvent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChroniclePage;