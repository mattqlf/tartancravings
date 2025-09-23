// Platform configuration settings
export interface PlatformConfig {
  hostEmail: string;
  feePercentage: number; // as decimal (0.20 = 20%)
  minimumFee?: number; // minimum fee in cents
  maximumFee?: number; // maximum fee in cents
}

// Default platform configuration
const DEFAULT_CONFIG: PlatformConfig = {
  hostEmail: process.env.PLATFORM_HOST_EMAIL || 'sb-0hy47346447940@business.example.com',
  feePercentage: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '0.20'), // 20%
  minimumFee: parseInt(process.env.PLATFORM_MIN_FEE_CENTS || '0'), // $0.00 minimum
  maximumFee: parseInt(process.env.PLATFORM_MAX_FEE_CENTS || '0'), // no maximum (0 = disabled)
};

export function getPlatformConfig(): PlatformConfig {
  return DEFAULT_CONFIG;
}

export function calculatePlatformFee(totalAmountCents: number): {
  platformFeeCents: number;
  payoutAmountCents: number;
  feePercentage: number;
} {
  const config = getPlatformConfig();

  // Calculate percentage-based fee
  let platformFeeCents = Math.round(totalAmountCents * config.feePercentage);

  // Apply minimum fee if set
  if (config.minimumFee && platformFeeCents < config.minimumFee) {
    platformFeeCents = config.minimumFee;
  }

  // Apply maximum fee if set
  if (config.maximumFee && config.maximumFee > 0 && platformFeeCents > config.maximumFee) {
    platformFeeCents = config.maximumFee;
  }

  // Ensure fee doesn't exceed total amount
  if (platformFeeCents >= totalAmountCents) {
    platformFeeCents = totalAmountCents - 1; // Leave at least 1 cent for recipient
  }

  const payoutAmountCents = totalAmountCents - platformFeeCents;

  return {
    platformFeeCents,
    payoutAmountCents,
    feePercentage: config.feePercentage
  };
}

export function validatePlatformConfig(): { valid: boolean; errors: string[] } {
  const config = getPlatformConfig();
  const errors: string[] = [];

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(config.hostEmail)) {
    errors.push('Invalid host email format');
  }

  // Validate fee percentage
  if (config.feePercentage < 0 || config.feePercentage > 1) {
    errors.push('Fee percentage must be between 0 and 1');
  }

  // Validate minimum/maximum fees
  if (config.minimumFee && config.minimumFee < 0) {
    errors.push('Minimum fee cannot be negative');
  }

  if (config.maximumFee && config.maximumFee < 0) {
    errors.push('Maximum fee cannot be negative');
  }

  if (config.minimumFee && config.maximumFee && config.minimumFee > config.maximumFee) {
    errors.push('Minimum fee cannot be greater than maximum fee');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}