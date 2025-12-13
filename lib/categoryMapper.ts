export interface FrontendCategory {
  name: string;
  slug: string;
}

export const FRONTEND_CATEGORIES: FrontendCategory[] = [
  { name: 'Vertical Blinds', slug: 'vertical-blinds' },
  { name: 'Replacement Vertical Slats', slug: 'replacement-vertical-slats' },
  { name: 'Roller Blinds', slug: 'roller-blinds' },
  { name: 'Motorized Blinds', slug: 'motorized-blinds' },
  { name: 'Motorized Roller Blinds', slug: 'motorized-roller-blinds' },
  { name: 'Complete Blackout Blinds', slug: 'complete-blackout-blinds' },
  { name: 'Metal Venetian Blinds', slug: 'metal-venetian-blinds' },
  { name: 'Roman Blinds', slug: 'roman-blinds' },
  { name: 'No Drill Blinds', slug: 'no-drill-blinds' },
  { name: 'Skylight Blinds', slug: 'skylight-blinds' },
  { name: 'Faux Wooden Blinds', slug: 'faux-wooden-blinds' },
  { name: 'Day and Night Blinds', slug: 'day-and-night-blinds' },
  { name: 'Blinds Accessories', slug: 'blinds-accessories' },
  { name: 'Motorized Day and Night Blinds', slug: 'motorized-day-and-night-blinds' },
];

const DB_TO_FRONTEND_MAPPING: Record<string, string> = {
  'vertical-blinds': 'vertical-blinds',
  'vertical blind': 'vertical-blinds',
  'vertical': 'vertical-blinds',
  'roller-blinds': 'roller-blinds',
  'roller blind': 'roller-blinds',
  'roller': 'roller-blinds',
  'venetian-blinds': 'metal-venetian-blinds',
  'venetian blind': 'metal-venetian-blinds',
  'venetian': 'metal-venetian-blinds',
  'metal venetian': 'metal-venetian-blinds',
  'metal-venetian-blinds': 'metal-venetian-blinds',
  'metal venetian blinds': 'metal-venetian-blinds',
  'roman-blinds': 'roman-blinds',
  'roman blind': 'roman-blinds',
  'roman': 'roman-blinds',
  'blackout-blinds': 'complete-blackout-blinds',
  'blackout blind': 'complete-blackout-blinds',
  'blackout': 'complete-blackout-blinds',
  'complete blackout': 'complete-blackout-blinds',
  'complete-blackout-blinds': 'complete-blackout-blinds',
  'complete blackout blinds': 'complete-blackout-blinds',
  'day-and-night-blinds': 'day-and-night-blinds',
  'day-night-blinds': 'day-and-night-blinds',
  'day & night blinds': 'day-and-night-blinds',
  'day & night blind': 'day-and-night-blinds',
  'day and night blinds': 'day-and-night-blinds',
  'day and night blind': 'day-and-night-blinds',
  'day and night': 'day-and-night-blinds',
  'day & night': 'day-and-night-blinds',
  'motorized': 'motorized-blinds',
  'motorized blind': 'motorized-blinds',
  'motorized-blinds': 'motorized-blinds',
  'motorized roller': 'motorized-roller-blinds',
  'motorized-roller-blinds': 'motorized-roller-blinds',
  'motorized day and night': 'motorized-day-and-night-blinds',
  'motorized day & night': 'motorized-day-and-night-blinds',
  'motorized-day-and-night-blinds': 'motorized-day-and-night-blinds',
  'motorized-day-night-blinds': 'motorized-day-and-night-blinds',
  'skylight': 'skylight-blinds',
  'skylight blind': 'skylight-blinds',
  'skylight-blinds': 'skylight-blinds',
  'faux wood': 'faux-wooden-blinds',
  'faux wooden': 'faux-wooden-blinds',
  'faux-wooden-blinds': 'faux-wooden-blinds',
  'no drill': 'no-drill-blinds',
  'no-drill-blinds': 'no-drill-blinds',
  'accessories': 'blinds-accessories',
  'blinds accessories': 'blinds-accessories',
  'blinds-accessories': 'blinds-accessories',
  'replacement vertical slats': 'replacement-vertical-slats',
  'replacement-vertical-slats': 'replacement-vertical-slats',
};

export function mapDbCategoryToFrontend(dbCategoryName: string, dbCategorySlug: string): string | null {
  let normalizedName = dbCategoryName.toLowerCase().trim();
  let normalizedSlug = dbCategorySlug.toLowerCase().trim();
  
  normalizedName = normalizedName.replace(/&/g, 'and').replace(/\s+/g, ' ');
  normalizedSlug = normalizedSlug.replace(/&/g, 'and');
  
  return DB_TO_FRONTEND_MAPPING[normalizedName] || 
         DB_TO_FRONTEND_MAPPING[normalizedSlug] || 
         null;
}

export function getFrontendCategoryBySlug(slug: string): FrontendCategory | undefined {
  return FRONTEND_CATEGORIES.find(cat => cat.slug === slug);
}

export function getFrontendCategoryByName(name: string): FrontendCategory | undefined {
  return FRONTEND_CATEGORIES.find(cat => cat.name === name);
}

export function getAllFrontendCategories(): FrontendCategory[] {
  return FRONTEND_CATEGORIES;
}

