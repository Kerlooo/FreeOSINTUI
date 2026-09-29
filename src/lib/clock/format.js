const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');

/**
 * Formats a date for the navbar clock in local time, with the month name in `locale`.
 * @param {Date} date
 * @param {string} [locale]
 * @returns {{ day: string, time: string, datetime: string }}
 */
export function formatClock(date, locale = 'en') {
	const month = new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).replace(/\.$/, '');
	const day = `${pad(date.getDate())} ${month}`;
	const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
	const datetime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${time}`;
	return { day, time, datetime };
}
