/** Launch markets first; extend as licences are obtained. */
export const COUNTRIES = [
  { code: "NG", name: "Nigeria", dial: "+234" },
  { code: "GH", name: "Ghana", dial: "+233" },
  { code: "KE", name: "Kenya", dial: "+254" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
] as const;

export const DEFAULT_DIAL = "+234";
