export const EQUIPMENT_TYPES = [
  'Dry Van',
  'Reefer',
  'Flatbed',
  'Step Deck',
  'Tanker',
  'Intermodal',
  'Box Truck',
  'Conestoga',
  'Power Only',
  'Lowboy',
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];
