// Currency conversion utilities
const USD_TO_THB_RATE = 35; // Reference rate: 1 USD = 35 THB

export function convertPrice(price: number, fromCurrency: string, toCurrency: string): number {
  // Handle null/undefined/invalid price values
  if (price === null || price === undefined || isNaN(price)) return 0;
  
  if (fromCurrency === toCurrency) return price;
  
  if (fromCurrency === "USD" && toCurrency === "THB") {
    return price * USD_TO_THB_RATE;
  } else if (fromCurrency === "THB" && toCurrency === "USD") {
    return price / USD_TO_THB_RATE;
  }
  return price;
}

export function getCurrencySymbol(currency: string): string {
  return currency === "USD" ? "$" : "฿";
}

export function formatPrice(price: number, currency: string): string {
  // Handle null/undefined/invalid price values
  if (price === null || price === undefined || isNaN(price)) {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}0`;
  }
  
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${price.toLocaleString()}`;
}

export function formatDualPrice(price: number, originalCurrency: string): string {
  // Handle null/undefined/invalid price values
  if (price === null || price === undefined || isNaN(price)) {
    return originalCurrency === "USD" ? "$0 (฿0)" : "฿0 ($0)";
  }
  
  const usdPrice = originalCurrency === "USD" ? price : convertPrice(price, originalCurrency, "USD");
  const thbPrice = originalCurrency === "THB" ? price : convertPrice(price, originalCurrency, "THB");
  
  // Ensure converted prices are valid numbers
  const validUsdPrice = (usdPrice === null || usdPrice === undefined || isNaN(usdPrice)) ? 0 : usdPrice;
  const validThbPrice = (thbPrice === null || thbPrice === undefined || isNaN(thbPrice)) ? 0 : thbPrice;
  
  if (originalCurrency === "USD") {
    return `$${validUsdPrice.toLocaleString()} (฿${Math.round(validThbPrice).toLocaleString()})`;
  } else {
    return `฿${validThbPrice.toLocaleString()} ($${Math.round(validUsdPrice).toLocaleString()})`;
  }
}

// Unified price formatting for all property types
export function formatPropertyPrice(
  price: string | number, 
  currency: string, 
  transactionType: string,
  rentPrice?: string | number,
  rentCurrency?: string
): { type: 'dual'; sale: string; rent: string } | string {
  // Handle null/undefined/invalid price values
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  const validPrice = (numPrice === null || numPrice === undefined || isNaN(numPrice)) ? 0 : numPrice;
  
  const salePrice = formatDualPrice(validPrice, currency);
  
  if (transactionType === "sell_or_rent" && rentPrice) {
    const numRentPrice = typeof rentPrice === 'string' ? parseFloat(rentPrice) : rentPrice;
    const validRentPrice = (numRentPrice === null || numRentPrice === undefined || isNaN(numRentPrice)) ? 0 : numRentPrice;
    const rentPriceFormatted = formatDualPrice(validRentPrice, rentCurrency || "USD");
    
    // Return a structured object that components can handle
    return {
      type: 'dual',
      sale: salePrice,
      rent: `${rentPriceFormatted}/mo`
    };
  }
  
  if (transactionType === "rent") {
    return `${salePrice}/mo`;
  }
  
  return salePrice;
}

// Google Maps utility
export function createGoogleMapsUrl(address: string, city?: string, state?: string): string {
  const fullAddress = [address, city, state].filter(Boolean).join(', ');
  const encodedAddress = encodeURIComponent(fullAddress);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}