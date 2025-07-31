interface OTPData {
  fileId: string;
  userId: string;
  timestamp: number;
  otp: string;
}

export class OTPManager {
  private otpStore: Map<string, OTPData> = new Map();
  private readonly OTP_VALIDITY_MINUTES = 5;

  async generateOTP(fileId: string, userId: string): Promise<string> {
    // Generate a simple 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpData: OTPData = {
      fileId,
      userId,
      timestamp: Date.now(),
      otp
    };

    this.otpStore.set(otp, otpData);

    // Clean up expired OTPs
    this.cleanupExpiredOTPs();

    return otp;
  }

  async verifyOTP(otp: string): Promise<boolean> {
    const otpData = this.otpStore.get(otp);
    
    if (!otpData) {
      return false;
    }

    // Check if OTP is expired
    const now = Date.now();
    const expiryTime = otpData.timestamp + (this.OTP_VALIDITY_MINUTES * 60 * 1000);
    
    if (now > expiryTime) {
      this.otpStore.delete(otp);
      return false;
    }

    return true;
  }

  async getFileInfo(otp: string): Promise<OTPData | null> {
    return this.otpStore.get(otp) || null;
  }

  private cleanupExpiredOTPs(): void {
    const now = Date.now();
    const expiryThreshold = this.OTP_VALIDITY_MINUTES * 60 * 1000;

    for (const [otp, data] of this.otpStore.entries()) {
      if (now - data.timestamp > expiryThreshold) {
        this.otpStore.delete(otp);
      }
    }
  }

  // Get all active OTPs (for debugging/admin purposes)
  getActiveOTPs(): OTPData[] {
    this.cleanupExpiredOTPs();
    return Array.from(this.otpStore.values());
  }

  // Manually expire an OTP
  expireOTP(otp: string): boolean {
    return this.otpStore.delete(otp);
  }

  // Set a custom OTP for a file
  async setCustomOTP(fileId: string, customOtp: string): Promise<void> {
    const existingData = Array.from(this.otpStore.values()).find(data => data.fileId === fileId);
    if (existingData) {
      // Remove old OTP and set new one
      this.otpStore.delete(existingData.otp);
    }

    const otpData: OTPData = {
      fileId,
      userId: 'system',
      timestamp: Date.now(),
      otp: customOtp
    };

    this.otpStore.set(customOtp, otpData);
  }

  // Remove an OTP
  async removeOTP(otp: string): Promise<boolean> {
    return this.otpStore.delete(otp);
  }
}
