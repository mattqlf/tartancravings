/**
 * Utilities for validating Carnegie Mellon University email domains
 */

export const CMU_EMAIL_DOMAIN = '@andrew.cmu.edu'

/**
 * Check if an email address belongs to Carnegie Mellon University
 */
export function isCMUEmail(email: string): boolean {
  return email.toLowerCase().endsWith(CMU_EMAIL_DOMAIN.toLowerCase())
}

/**
 * Extract Andrew ID from CMU email
 * Example: john.doe@andrew.cmu.edu -> john.doe
 */
export function extractAndrewId(email: string): string | null {
  if (!isCMUEmail(email)) {
    return null
  }
  return email.split('@')[0]
}

/**
 * Validate if a user object has a valid CMU email
 */
export function validateCMUUser(user: { email?: string }): boolean {
  return !!(user.email && isCMUEmail(user.email))
}

/**
 * Get user display name from CMU email
 * Converts andrew.id@andrew.cmu.edu to "Andrew Id"
 */
export function getCMUDisplayName(email: string): string {
  const andrewId = extractAndrewId(email)
  if (!andrewId) return email

  return andrewId
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}