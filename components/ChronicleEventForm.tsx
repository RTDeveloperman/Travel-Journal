
import React, { useState, useEffect, useCallback } from 'react';
import { ChronicleEvent, ImageFile } from '../types';

interface ChronicleEventFormProps {
  onSubmit: (title: string, description: string, image: ImageFile | null, eventDate: string, includeInEventsTour?: boolean) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  initialData?: ChronicleEvent | null;
  eventDateFromPicker: string; // The date selected in ChroniclePage
  userDateOfBirth: string; // User's DOB for validation
}

const ChronicleEventForm: React.FC<ChronicleEventFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  initialData,
  eventDateFromPicker,
  userDateOfBirth,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState<string>(eventDateFromPicker); // Date of the event itself
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [includeInEventsTour, setIncludeInEventsTour] = useState<boolean>(false); // New state
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setEventDate(initialData.eventDate); // Use event's own date when editing
      setSelectedImage(initialData.image || null);
      setImagePreview(initialData.image?.dataUrl || null);
      setIncludeInEventsTour(initialData.includeInEventsTour || false); // Set from initial data
    } else {
      // For new event, use the date from the parent picker
      setTitle('');
      setDescription('');
      setEventDate(eventDateFromPicker);
      setSelectedImage(null);
      setImagePreview(null);
      setIncludeInEventsTour(false); // Reset for new event
    }
    setError(null);
  }, [initialData, eventDateFromPicker]);

  // Update local eventDate if parent picker changes AND we are not editing (or if editing, only if initialData changes)
  useEffect(() => {
    if (!isEditing) {
      setEventDate(eventDateFromPicker);
    }
  }, [eventDateFromPicker, isEditing]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError("فایل انتخاب شده یک تصویر معتبر نیست.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const imgFile: ImageFile = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type,
          dataUrl: reader.result as string,
        };
        setSelectedImage(imgFile);
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
       e.target.value = ''; // Allow re-selecting the same file
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("تیتر رویداد الزامی است.");
      return;
    }
    if (eventDate < userDateOfBirth) {
        setError(`تاریخ رویداد (${eventDate}) نمی‌تواند قبل از تاریخ تولد شما (${userDateOfBirth}) باشد.`);
        return;
    }
    await onSubmit(title, description, selectedImage, eventDate, includeInEventsTour);
  }, [title, description, selectedImage, eventDate, userDateOfBirth, includeInEventsTour, onSubmit]);

  return (
    <div className="bg-white bg-opacity-95 p-6 sm:p-8 rounded-xl shadow-2xl mb-8 transform transition-all duration-300 ease-in-out">
      <form onSubmit={handleSubmit} className="space-y-6 text-right">
        <h3 className="text-2xl font-semibold text-center text-slate-800 mb-6">
          {isEditing ? 'ویرایش رویداد روزنگار' : 'افزودن رویداد جدید به روزنگار'}
        </h3>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 text-sm" role="alert">{error}</div>}

        <div>
          <label htmlFor="chronicleEventDate" className="block text-sm font-medium text-slate-700 mb-1">
            <i className="fas fa-calendar-alt ml-2 text-emerald-500"></i>تاریخ رویداد
          </label>
          <input
            type="date"
            id="chronicleEventDate"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            min={userDateOfBirth}
            className="mt-1 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-slate-900"
            required
          />
           {eventDate < userDateOfBirth && <p className="text-xs text-red-600 mt-1">تاریخ رویداد نمی‌تواند قبل از تاریخ تولد شما باشد.</p>}
        </div>

        <div>
          <label htmlFor="chronicleTitle" className="block text-sm font-medium text-slate-700 mb-1">
            <i className="fas fa-heading ml-2 text-emerald-500"></i>تیتر رویداد <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="chronicleTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-slate-900"
            placeholder="مثال: فارغ‌التحصیلی، اولین روز کاری"
            required
          />
        </div>

        <div>
          <label htmlFor="chronicleDescription" className="block text-sm font-medium text-slate-700 mb-1">
            <i className="fas fa-align-left ml-2 text-emerald-500"></i>شرح (اختیاری)
          </label>
          <textarea
            id="chronicleDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-slate-900"
            placeholder="توضیحات بیشتر درباره این رویداد..."
          />
        </div>

        <div>
          <label htmlFor="chronicleImage" className="block text-sm font-medium text-slate-700 mb-1">
            <i className="fas fa-image ml-2 text-emerald-500"></i>تصویر (اختیاری، حداکثر ۵ مگابایت)
          </label>
          <input
            type="file"
            id="chronicleImage"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-slate-500 file:ml-4 file:mr-0 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-600 hover:file:bg-emerald-100"
          />
        </div>

        {imagePreview && (
          <div className="mt-2 relative group w-32 h-32">
            <img src={imagePreview} alt="پیش‌نمایش تصویر رویداد" className="w-full h-full object-cover rounded-md shadow-md"/>
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-0 left-0 m-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
              aria-label="حذف تصویر"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

         {/* Include in Events Tour Checkbox */}
        <div className="pt-4 border-t border-slate-200 text-right">
            <label htmlFor="includeChronicleInTour" className="flex items-center space-x-2 cursor-pointer flex-row-reverse justify-end">
                <span className="text-sm font-medium text-slate-700 mr-2">
                    <i className="fas fa-star ml-1 text-yellow-500"></i>نمایش این رویداد در "تور وقایع من"
                </span>
                <input
                    type="checkbox"
                    id="includeChronicleInTour"
                    checked={includeInEventsTour}
                    onChange={(e) => setIncludeInEventsTour(e.target.checked)}
                    className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
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
            disabled={isLoading || eventDate < userDateOfBirth}
            className="px-6 py-2 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
          >
            {isLoading ? (
              <><i className="fas fa-spinner fa-spin ml-2"></i> در حال ذخیره...</>
            ) : (
              <><i className={`fas ${isEditing ? 'fa-save' : 'fa-plus-circle'} ml-2`}></i> {isEditing ? 'به‌روزرسانی رویداد' : 'ذخیره رویداد'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChronicleEventForm;