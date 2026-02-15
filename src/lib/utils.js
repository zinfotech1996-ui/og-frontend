import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


/**
 * Format a datetime string to HH:MM:SS (24-hour format)
 * @param {string|Date} datetime - ISO datetime string or Date object
 * @returns {string} Time in HH:MM:SS format
 */
export function formatTimeHHMMSS(datetime) {
  if (!datetime) return '--:--:--';
  
  const date = new Date(datetime);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format duration in seconds to HH:MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Duration in HH:MM:SS format
 */
export function formatDurationHHMMSS(seconds) {
  if (!seconds && seconds !== 0) return '--:--:--';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}