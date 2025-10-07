import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BLOOD_TYPE_COMPATIBILITY = {
  'A+': { canDonateTo: ['A+', 'AB+'], canReceiveFrom: ['A+', 'A-', 'O+', 'O-'] },
  'A-': { canDonateTo: ['A+', 'A-', 'AB+', 'AB-'], canReceiveFrom: ['A-', 'O-'] },
  'B+': { canDonateTo: ['B+', 'AB+'], canReceiveFrom: ['B+', 'B-', 'O+', 'O-'] },
  'B-': { canDonateTo: ['B+', 'B-', 'AB+', 'AB-'], canReceiveFrom: ['B-', 'O-'] },
  'AB+': { canDonateTo: ['AB+'], canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  'AB-': { canDonateTo: ['AB+', 'AB-'], canReceiveFrom: ['A-', 'B-', 'AB-', 'O-'] },
  'O+': { canDonateTo: ['A+', 'B+', 'AB+', 'O+'], canReceiveFrom: ['O+', 'O-'] },
  'O-': { canDonateTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], canReceiveFrom: ['O-'] }
} as const;

/**
 * Get compatible blood types for emergency alerts
 * For emergency alerts, we need donors who can donate TO the emergency blood type
 * This means we need to find all blood types where canDonateTo includes the emergency blood type
 */
export function getCompatibleBloodTypesForEmergency(emergencyBloodType: string): string[] {
  const compatibleDonors: string[] = [];
  
  // Find all blood types that can donate to the emergency blood type
  for (const [donorType, compatibility] of Object.entries(BLOOD_TYPE_COMPATIBILITY)) {
    if (compatibility.canDonateTo.includes(emergencyBloodType as any)) {
      compatibleDonors.push(donorType);
    }
  }
  
  return compatibleDonors;
}

/**
 * Get compatible blood types for donor search
 * For donor search, we need recipients who can receive FROM the donor blood type
 */
export function getCompatibleBloodTypesForDonorSearch(donorBloodType: string): string[] {
  const compatibility = BLOOD_TYPE_COMPATIBILITY[donorBloodType as keyof typeof BLOOD_TYPE_COMPATIBILITY];
  if (!compatibility) {
    return [];
  }
  
  // For donor search, we want recipients who can receive FROM the donor blood type
  return [...compatibility.canReceiveFrom];
}