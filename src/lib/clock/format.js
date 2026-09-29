const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');

/**
 * Formats a date for the navbar clock in local time.
 * @param {Date} date
 * @returns {{ day: string, time: string, datetime: string }}
 */
export function formatClock(date) {
	const day = `${pad(date.getDate())} ${MONTHS[date.getMonth()]}`;
	const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
	const datetime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${time}`;
	return { day, time, datetime };
}
