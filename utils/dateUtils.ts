
import { formatDistanceToNowStrict as formatDistance, isToday as dfnsIsToday, isYesterday as dfnsIsYesterday, format } from 'date-fns';
import { faIR } from 'date-fns/locale'; // Persian locale

/**
 * Splits an ISO date string into date (YYYY-MM-DD) and time (HH:MM) parts.
 * @param isoString The ISO date string (e.g., "2023-10-26T10:00:00.000Z").
 * @returns An object with dateString and timeString, or default values if input is invalid.
 */
export const splitISOToDateAndTime = (isoString?: string): { dateString: string; timeString: string } => {
  if (!isoString) {
    const now = new Date();
    return {
      dateString: now.toISOString().split('T')[0], // YYYY-MM-DD
      timeString: now.toTimeString().slice(0, 5),   // HH:MM
    };
  }
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) throw new Error("Invalid date");

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return {
      dateString: `${year}-${month}-${day}`,
      timeString: `${hours}:${minutes}`,
    };
  } catch (error) {
    console.error("Error splitting ISO string:", error);
    const now = new Date();
    return {
      dateString: now.toISOString().split('T')[0],
      timeString: now.toTimeString().slice(0, 5),
    };
  }
};

/**
 * Combines a date string (YYYY-MM-DD) and a time string (HH:MM) into a local ISO date string.
 * Note: This creates a date assuming local timezone. If UTC is strictly needed for *input*,
 * Date.UTC or manual construction would be required, but usually new Date().toISOString()
 * is used to get the UTC representation after creation.
 * @param dateString The date string in "YYYY-MM-DD" format.
 * @param timeString The time string in "HH:MM" format.
 * @returns A local ISO date string (e.g., "2023-10-26T10:00:00.000Z" if local matches UTC, or with offset)
 *          or an empty string if input is invalid.
 */
export const combineDateAndTime = (dateString: string, timeString: string): string => {
  if (!dateString || !timeString) return '';
  try {
    // Example: dateString = "2023-04-15", timeString = "14:30"
    // Creates a date object representing 2023-04-15 at 14:30 in the *local* timezone.
    const localDate = new Date(`${dateString}T${timeString}:00`);
    if (isNaN(localDate.getTime())) {
      console.error("Invalid date or time for combining:", dateString, timeString);
      return '';
    }
    // .toISOString() always returns the date in UTC.
    return localDate.toISOString();
  } catch (error) {
    console.error("Error combining date and time:", error);
    return '';
  }
};


/**
 * Formats an ISO date string to a readable localized date and time string.
 * Uses 'fa-IR' locale for Persian numbers and general formatting, but date itself is Gregorian.
 * @param isoString The ISO date string.
 * @param options Optional: { showTime: boolean } to include time.
 * @returns Formatted date string (e.g., "۱۴۰۲/۲/۲۶، ساعت ۱۰:۰۰" or "۲۶ آوریل ۲۰۲۳، ساعت ۱۰:۰۰" depending on browser's fa-IR).
 */
export const formatDateTimeForDisplay = (isoString?: string, options: { showTime?: boolean, dateStyle?: "long" | "short" | "medium" | "full", timeStyle?: "long" | "short" | "medium" | "full" } = {}): string => {
  if (!isoString) return "تاریخ نامشخص";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "تاریخ نامعتبر";

    const { 
      showTime = true, 
      dateStyle = 'medium', // e.g., Apr 26, 2023 / ۲۶ آوریل ۲۰۲۳
      timeStyle = 'short'   // e.g., 10:00 AM / ۱۰:۰۰
    } = options;

    const formattingOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: dateStyle === 'long' ? 'long' : (dateStyle === 'short' ? 'numeric' : 'short'),
      day: 'numeric',
      hour12: false, // Use 24-hour format typically
    };

    if (showTime) {
      formattingOptions.hour = '2-digit';
      formattingOptions.minute = '2-digit';
      if (timeStyle === 'medium' || timeStyle === 'long') {
        formattingOptions.second = '2-digit';
      }
    }
    
    // Using 'fa-IR' will attempt to use Persian numbering and date formatting conventions.
    // The underlying date is still Gregorian.
    return date.toLocaleString('fa-IR', formattingOptions);

  } catch (error) {
    console.error("Error formatting date for display:", error);
    return "خطا در نمایش تاریخ";
  }
};

// --- Chat Specific Date Utils ---

/**
 * Formats a date string or Date object to a relative time string (e.g., "5 minutes ago").
 * Uses Persian locale.
 * @param date The date to format.
 * @returns A string representing the relative time.
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'زمان نامشخص';
    return formatDistance(d, new Date(), { addSuffix: true, locale: faIR });
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return 'خطا در زمان';
  }
};

export const isToday = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return dfnsIsToday(d);
};

export const isYesterday = (date: string | Date): boolean => {
   const d = typeof date === 'string' ? new Date(date) : date;
  return dfnsIsYesterday(d);
};


/**
 * Formats a chat message timestamp for display.
 * Shows "Today HH:mm", "Yesterday HH:mm", or "dd MMM HH:mm".
 * Uses Persian locale.
 * @param isoString The ISO timestamp string.
 * @returns Formatted timestamp string.
 */
export const formatChatMessageTimestamp = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "زمان نامشخص";

    if (isToday(date)) {
      return `امروز ${format(date, 'HH:mm', { locale: faIR })}`;
    }
    if (isYesterday(date)) {
      return `دیروز ${format(date, 'HH:mm', { locale: faIR })}`;
    }
    // Example: ۱۷ اردیبهشت، ۱۰:۳۰
    return format(date, 'dd MMM، HH:mm', { locale: faIR }); 
  } catch (error) {
    console.error("Error formatting chat message timestamp:", error);
    return "خطا در نمایش زمان";
  }
};
