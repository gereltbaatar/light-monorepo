/**
 * Formats a number as Mongolian tugrik currency with thousand separators
 * @param amount - The numeric amount to format
 * @returns Formatted string with ₮ symbol (e.g., "₮10,000")
 *
 * @example
 * moneyFormatter(10000) // "₮10,000"
 * moneyFormatter(1234567) // "₮1,234,567"
 * moneyFormatter(500) // "₮500"
 */
export function moneyFormatter(amount: number): string {
    const formatted = amount.toLocaleString('en-US');
    return `₮${formatted}`;
}
