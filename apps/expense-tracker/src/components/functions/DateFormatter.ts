/**
 * Formats various date inputs into 'Month Day' style
 * Examples: 'April 3', '4-р сарын 3'
 */

type DateInput = Date | string | number;

interface DateFormatOptions {
  locale?: string;
  monthFormat?: 'long' | 'short' | 'numeric';
}

/**
 * Mongolian month names with suffix
 */
const MONGOLIAN_MONTHS = [
  '1-р сарын',
  '2-р сарын',
  '3-р сарын',
  '4-р сарын',
  '5-р сарын',
  '6-р сарын',
  '7-р сарын',
  '8-р сарын',
  '9-р сарын',
  '10-р сарын',
  '11-р сарын',
  '12-р сарын',
];

/**
 * Parses various date input formats into a Date object
 */
function parseDate(input: DateInput): Date {
  if (input instanceof Date) {
    return input;
  }

  if (typeof input === 'number') {
    return new Date(input);
  }

  // Handle string inputs
  if (typeof input === 'string') {
    // Try ISO format (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, etc.)
    const isoDate = new Date(input);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try common formats
    const formats = [
      // MM/DD/YYYY or M/D/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // DD-MM-YYYY or D-M-YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      // YYYY/MM/DD
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
    ];

    for (const format of formats) {
      const match = input.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        // Try different interpretations
        const dates = [
          new Date(`${part1}/${part2}/${part3}`),
          new Date(`${part2}/${part1}/${part3}`),
          new Date(`${part3}/${part1}/${part2}`),
        ];

        for (const date of dates) {
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
    }
  }

  throw new Error(`Unable to parse date: ${input}`);
}

/**
 * Formats a date into 'Month Day' style
 * @param input - Date, timestamp, or date string
 * @param options - Formatting options
 * @returns Formatted date string (e.g., 'April 3' or '4-р сарын 3')
 */
export function formatDate(
  input: DateInput,
  options: DateFormatOptions = {}
): string {
  const { locale = 'en', monthFormat = 'long' } = options;
  const date = parseDate(input);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  const day = date.getDate();
  const month = date.getMonth();

  // Mongolian format
  if (locale === 'mn' || locale === 'mn-MN') {
    return `${MONGOLIAN_MONTHS[month]} ${day}`;
  }

  // English format
  if (monthFormat === 'numeric') {
    return `${month + 1}/${day}`;
  }

  const monthName = date.toLocaleString('en-US', {
    month: monthFormat === 'short' ? 'short' : 'long',
  });

  return `${monthName} ${day}`;
}

/**
 * Formats a date with the current year if different, omits if same year
 * @param input - Date, timestamp, or date string
 * @param options - Formatting options
 * @returns Formatted date string with optional year
 */
export function formatDateWithYear(
  input: DateInput,
  options: DateFormatOptions = {}
): string {
  const date = parseDate(input);
  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();

  const baseFormat = formatDate(input, options);

  if (dateYear !== currentYear) {
    return `${baseFormat}, ${dateYear}`;
  }

  return baseFormat;
}

/**
 * Formats a date range
 * @param start - Start date
 * @param end - End date
 * @param options - Formatting options
 * @returns Formatted date range string
 */
export function formatDateRange(
  start: DateInput,
  end: DateInput,
  options: DateFormatOptions = {}
): string {
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  const startMonth = startDate.getMonth();
  const endMonth = endDate.getMonth();
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  // Same month and year
  if (startMonth === endMonth && startYear === endYear) {
    const monthName = formatDate(startDate, options).split(' ')[0];
    return `${monthName} ${startDate.getDate()}-${endDate.getDate()}`;
  }

  // Different months or years
  return `${formatDateWithYear(startDate, options)} - ${formatDateWithYear(endDate, options)}`;
}

/**
 * Gets relative time string (e.g., "Today", "Yesterday", "2 days ago")
 */
export function getRelativeTime(input: DateInput, locale: string = 'en'): string {
  const date = parseDate(input);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (locale === 'mn' || locale === 'mn-MN') {
    if (diffDays === 0) return 'Өнөөдөр';
    if (diffDays === 1) return 'Өчигдөр';
    if (diffDays === 2) return 'Уржигдар';
    if (diffDays < 7) return `${diffDays} өдрийн өмнө`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} долоо хоногийн өмнө`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} сарын өмнө`;
    return `${Math.floor(diffDays / 365)} жилийн өмнө`;
  }

  // English
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
