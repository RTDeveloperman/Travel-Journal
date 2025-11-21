


import React, { useState, useCallback, useEffect } from 'react';
import { ImageFile, Coordinates, MemoryEntry, Companion, MemoryCompanionLink } from '../types';
import MapPicker from './MapPicker';
import { 
  splitISOToDateAndTime,
  combineDateAndTime
} from '../utils/dateUtils';

interface MemoryFormProps {
  onSubmit: (
    locationName: string, 
    title: string, 
    description:string, 
    images: ImageFile[], 
    companions: MemoryCompanionLink[],
    eventDate: string, 
    coordinates?: Coordinates,
    includeInEventsTour?: boolean,
    showInExplore?: boolean // Added
  ) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  initialData?: MemoryEntry | null;
  companionsList: Companion[]; // These are companions specific to the logged-in user
}

const MemoryForm: React.FC<MemoryFormProps> = ({ onSubmit, onCancel, isLoading, initialData, companionsList }) => {
  const [locationName, setLocationName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const initialDateParts = splitISOToDateAndTime(new Date().toISOString());
  const [eventDateString, setEventDateString] = useState<string>(initialDateParts.dateString); // YYYY-MM-DD
  const [eventTimeString, setEventTimeString] = useState<string>(initialDateParts.timeString); // HH:MM

  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<Coordinates | undefined>(undefined);
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [selectedCompanions, setSelectedCompanions] = useState<MemoryCompanionLink[]>([]);
  const [includeInEventsTour, setIncludeInEventsTour] = useState<boolean>(false); 
  const [showInExplore, setShowInExplore] = useState<boolean>(false); // New state
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setLocationName(initialData.locationName);
      setTitle(initialData.title);
      setDescription(initialData.description);
      const { dateString, timeString } = splitISOToDateAndTime(initialData.eventDate);
      setEventDateString(dateString);
      setEventTimeString(timeString);
      setSelectedImages(initialData.images || []);
      setImagePreviews((initialData.images || []).map(img => img.dataUrl));
      if (initialData.latitude && initialData.longitude) {
        setSelectedCoords({ lat: initialData.latitude, lng: initialData.longitude });
      } else {
        setSelectedCoords(undefined);
      }
      setSelectedCompanions(initialData.companions || []);
      setIncludeInEventsTour(initialData.includeInEventsTour || false); 
      setShowInExplore(initialData.showInExplore || false); // Set from initial data
      setError(null);
    } else {
      // Reset form for new entry
      setLocationName('');
      setTitle('');
      setDescription('');
      const nowDateParts = splitISOToDateAndTime(new Date().toISOString());
      setEventDateString(nowDateParts.dateString);
      setEventTimeString(nowDateParts.timeString);
      setSelectedImages([]);
      setImagePreviews([]);
      setSelectedCoords(undefined);
      setSelectedCompanions([]);
      setIncludeInEventsTour(false);
      setShowInExplore(false);
    }
  }, [initialData]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      if (selectedImages.length + filesArray.length > 5) {
        setError("حداکثر می‌توانید ۵ تصویر بارگذاری کنید.");
        return;
      }

      const newImageFiles: ImageFile[] = [];
      const newImagePreviewsHolder: string[] = []; 

      let filesProcessed = 0;

      filesArray.forEach(file => {
        if (!file.type.startsWith('image/')) {
            setError(`فایل "${file.name}" یک تصویر معتبر نیست.`);
            filesProcessed++;
            if (filesProcessed === filesArray.length) {
                 setSelectedImages(prev => [...prev, ...newImageFiles]);
                 setImagePreviews(prev => [...prev, ...newImagePreviewsHolder]);
            }
            return;
        }
        if (file.size > 5 * 1024 * 1024) { 
            setError(`فایل "${file.name}" خیلی بزرگ است (حداکثر ۵ مگابایت).`);
            filesProcessed++;
            if (filesProcessed === filesArray.length) {
                 setSelectedImages(prev => [...prev, ...newImageFiles]);
                 setImagePreviews(prev => [...prev, ...newImagePreviewsHolder]);
            }
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          newImageFiles.push({
            id: Date.now().toString() + Math.random().toString(), 
            name: file.name,
            type: file.type,
            dataUrl: reader.result as string,
          });
          newImagePreviewsHolder.push(reader.result as string);
          filesProcessed++;
          if (filesProcessed === filesArray.length) {
             setSelectedImages(prev => [...prev, ...newImageFiles]);
             setImagePreviews(prev => [...prev, ...newImagePreviewsHolder]);
          }
        };
        reader.onerror = () => {
            setError(`خطا در خواندن فایل "${file.name}".`);
            filesProcessed++;
            if (filesProcessed === filesArray.length) {
                 setSelectedImages(prev => [...prev, ...newImageFiles]);
                 setImagePreviews(prev => [...prev, ...newImagePreviewsHolder]);
            }
        };
        reader.readAsDataURL(file);
      });
       event.target.value = ''; 
    }
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleLocationSelect = (coords: Coordinates) => {
    setSelectedCoords(coords);
    setShowMapPicker(false);
  };

  const handleToggleCompanion = (companionId: string) => {
    setSelectedCompanions(prev => {
      const existing = prev.find(c => c.companionId === companionId);
      if (existing) {
        return prev.filter(c => c.companionId !== companionId);
      } else {
        const companionExists = companionsList.some(comp => comp.id === companionId);
        if (companionExists) {
            return [...prev, { companionId, roleInTrip: '' }];
        }
        return prev; 
      }
    });
  };

  const handleCompanionRoleChange = (companionId: string, role: string) => {
    setSelectedCompanions(prev => 
      prev.map(c => c.companionId === companionId ? { ...c, roleInTrip: role } : c)
    );
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!locationName.trim() || !title.trim() || !description.trim() || !eventDateString || !eventTimeString) {
      setError('نام مکان، عنوان، توضیحات، تاریخ و ساعت رویداد الزامی هستند.');
      return;
    }
    const eventDateISO = combineDateAndTime(eventDateString, eventTimeString);
    if (!eventDateISO) {
      setError('تاریخ یا ساعت وارد شده نامعتبر است.');
      return;
    }
    const validSelectedCompanions = selectedCompanions.filter(sc => 
        companionsList.some(comp => comp.id === sc.companionId)
    );

    await onSubmit(locationName, title, description, selectedImages, validSelectedCompanions, eventDateISO, selectedCoords, includeInEventsTour, showInExplore);
  }, [locationName, title, description, selectedImages, selectedCompanions, eventDateString, eventTimeString, selectedCoords, includeInEventsTour, showInExplore, onSubmit, companionsList]);
  

  return (
    <>
      <div className="bg-white bg-opacity-95 p-6 sm:p-8 rounded-xl shadow-2xl mb-8 transform transition-all duration-500 ease-in-out">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-3xl font-semibold text-center text-slate-800 mb-6">
            {isEditing ? 'ویرایش خاطره' : 'ایجاد خاطره جدید'}
          </h2>
          
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-right" role="alert">{error}</div>}

          <div>
            <label htmlFor="locationName" className="block text-sm font-medium text-slate-700 mb-1 text-right">
              <i className="fas fa-map-marker-alt ml-2 text-sky-500"></i>نام مکان
            </label>
            <input
              type="text"
              id="locationName"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-900 text-right"
              placeholder="مثال: برج ایفل، پاریس"
              required
              aria-required="true"
            />
          </div>

          <div className="text-sm text-slate-600 text-right">
            <button 
              type="button" 
              onClick={() => setShowMapPicker(true)}
              className="mb-2 px-4 py-2 text-sm font-medium text-sky-600 bg-sky-100 rounded-md hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            >
              <i className="fas fa-map-pin ml-2"></i>یا انتخاب مکان از روی نقشه
            </button>
            {selectedCoords && (
              <p className="text-xs text-green-600">
                انتخاب شد: عرض جغرافیایی: {selectedCoords.lat.toFixed(5)}، طول جغرافیایی: {selectedCoords.lng.toFixed(5)}
                <button 
                  type="button" 
                  onClick={() => setSelectedCoords(undefined)} 
                  className="mr-2 text-red-500 hover:text-red-700 text-xs"
                  aria-label="پاک کردن مختصات انتخاب شده"
                >
                  (پاک کردن)
                </button>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1 text-right">
              <i className="fas fa-heading ml-2 text-sky-500"></i>عنوان
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-900 text-right"
              placeholder="مثال: یک بعد از ظهر آفتابی"
              required
              aria-required="true"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-slate-700 mb-1 text-right">
                <i className="fas fa-calendar-alt ml-2 text-sky-500"></i>تاریخ رویداد
              </label>
              <input
                type="date"
                id="eventDate"
                value={eventDateString}
                onChange={(e) => setEventDateString(e.target.value)}
                className="mt-1 block w-full text-slate-900 text-right" 
                required
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor="eventTime" className="block text-sm font-medium text-slate-700 mb-1 text-right">
                <i className="fas fa-clock ml-2 text-sky-500"></i>ساعت رویداد
              </label>
              <input
                type="time"
                id="eventTime"
                value={eventTimeString}
                onChange={(e) => setEventTimeString(e.target.value)}
                className="mt-1 block w-full text-slate-900 text-right" 
                required
                aria-required="true"
              />
            </div>
          </div>


          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1 text-right">
             <i className="fas fa-pen-alt ml-2 text-sky-500"></i>توضیحات / یادداشت‌ها
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-900 text-right"
              placeholder="افکار و تجربیات خود را به اشتراک بگذارید..."
              required
              aria-required="true"
            />
          </div>
          
          <div>
            <label htmlFor="imageUpload" className="block text-sm font-medium text-slate-700 mb-1 text-right">
              <i className="fas fa-images ml-2 text-sky-500"></i>بارگذاری تصاویر (حداکثر ۵ تصویر، هر کدام ۵ مگابایت)
            </label>
            <input
              type="file"
              id="imageUpload"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-slate-500 file:ml-4 file:mr-0 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-600 hover:file:bg-sky-100"
              aria-describedby="image-upload-constraints"
            />
            <p id="image-upload-constraints" className="mt-1 text-xs text-slate-500 text-right">حداکثر ۵ تصویر، هر کدام ۵ مگابایت.</p>
          </div>

          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {imagePreviews.map((previewUrl, index) => (
                <div key={index} className="relative group">
                  <img src={previewUrl} alt={`پیش‌نمایش ${selectedImages[index]?.name || `تصویر ${index + 1}`}`} className="w-full h-24 object-cover rounded-md shadow-md"/>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-0 left-0 m-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    aria-label={`حذف تصویر ${index + 1}`}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Companions Section */}
          {companionsList.length > 0 && (
            <div className="pt-4 border-t border-slate-200 text-right">
              <h3 className="text-lg font-medium text-slate-700 mb-2">
                <i className="fas fa-users ml-2 text-sky-500"></i>همسفران در این سفر
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {companionsList.map(comp => {
                  const isSelected = selectedCompanions.some(sc => sc.companionId === comp.id);
                  const currentRole = selectedCompanions.find(sc => sc.companionId === comp.id)?.roleInTrip || '';
                  return (
                    <div key={comp.id} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`companion-${comp.id}`} className="flex items-center space-x-2 cursor-pointer flex-row-reverse">
                          <input
                            type="checkbox"
                            id={`companion-${comp.id}`}
                            checked={isSelected}
                            onChange={() => handleToggleCompanion(comp.id)}
                            className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 ml-2"
                          />
                          <span className="text-sm font-medium text-slate-800">{comp.name}</span>
                        </label>
                      </div>
                      {isSelected && (
                        <div className="mt-2 mr-6">
                          <label htmlFor={`role-${comp.id}`} className="block text-xs font-medium text-slate-600 mb-0.5">
                            نقش/نسبت در این سفر (اختیاری):
                          </label>
                          <input
                            type="text"
                            id={`role-${comp.id}`}
                            value={currentRole}
                            onChange={(e) => handleCompanionRoleChange(comp.id, e.target.value)}
                            className="mt-0.5 block w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-xs text-slate-900 text-right"
                            placeholder="مثال: راهنما، بهترین دوست"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
               {selectedCompanions.length === 0 && <p className="text-xs text-slate-500 mt-1">همسفری برای این خاطره انتخاب نشده است.</p>}
            </div>
          )}
           {companionsList.length === 0 && (
              <div className="pt-4 border-t border-slate-200 text-right">
                 <p className="text-sm text-slate-500">
                    همسفری برای شما ثبت نشده. می‌توانید از دکمه "همسفران" در بالای صفحه، همسفران خود را اضافه کنید.
                 </p>
              </div>
           )}

            <div className="pt-4 border-t border-slate-200 space-y-3 text-right">
                <label htmlFor="includeInTour" className="flex items-center space-x-2 cursor-pointer flex-row-reverse justify-end">
                    <span className="text-sm font-medium text-slate-700 mr-2">
                        <i className="fas fa-star ml-1 text-yellow-500"></i>نمایش این خاطره در "تور وقایع من"
                    </span>
                    <input
                        type="checkbox"
                        id="includeInTour"
                        checked={includeInEventsTour}
                        onChange={(e) => setIncludeInEventsTour(e.target.checked)}
                        className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                    />
                </label>
                <label htmlFor="showInExplore" className="flex items-center space-x-2 cursor-pointer flex-row-reverse justify-end">
                    <span className="text-sm font-medium text-slate-700 mr-2">
                        <i className="fas fa-globe-americas ml-1 text-blue-500"></i>نمایش این خاطره در صفحه "کاوش" عمومی
                    </span>
                    <input
                        type="checkbox"
                        id="showInExplore"
                        checked={showInExplore}
                        onChange={(e) => setShowInExplore(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                </label>
            </div>


          <div className="flex items-center justify-start space-x-4 space-x-reverse pt-4 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin ml-2"></i> 
                  {isEditing ? 'در حال به‌روزرسانی...' : 'در حال ذخیره...'}
                </>
              ) : (
                <>
                  <i className={`fas ${isEditing ? 'fa-save' : 'fa-plus-circle'} ml-2`}></i> 
                  {isEditing ? 'به‌روزرسانی خاطره' : 'ذخیره خاطره'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      {showMapPicker && (
        <MapPicker 
          onLocationSelect={handleLocationSelect}
          onCancel={() => setShowMapPicker(false)}
          currentCoordinates={selectedCoords}
        />
      )}
    </>
  );
};

export default MemoryForm;