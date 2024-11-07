export interface IOtp {
  generateOtp(): string;

  storeOtp(email: string, otp: string): Promise<void>;

  validateOtp(email: string, otp: string): boolean;

  isEmailVerified(email: string): boolean;

  removeVerifiedEmail(email: string): void;

  sendOtp(email: string): Promise<void>;
}
