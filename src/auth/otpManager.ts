import * as speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';

interface OTPData {
  secret: string;
  token: string;
  expiresAt: number;
  peerId: string;
}

export class OTPManager {
  private otpStore: Map<string, OTPData> = new Map();
  private readonly OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes

  generateOTP(peerId: string): { token: string; secret: string } {
    const secret = speakeasy.generateSecret({
      name: `P2P File Share - ${peerId}`,
      length: 20
    });

    const token = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32',
      step: 300, // 5 minutes
      window: 1
    });

    const otpData: OTPData = {
      secret: secret.base32,
      token,
      expiresAt: Date.now() + this.OTP_EXPIRY,
      peerId
    };

    this.otpStore.set(token, otpData);

    // Clean up expired OTPs
    this.cleanupExpiredOTPs();

    return { token, secret: secret.base32 };
  }

  verifyOTP(token: string, peerId: string): boolean {
    const otpData = this.otpStore.get(token);
    
    if (!otpData) {
      return false;
    }

    if (Date.now() > otpData.expiresAt) {
      this.otpStore.delete(token);
      return false;
    }

    if (otpData.peerId !== peerId) {
      return false;
    }

    const isValid = speakeasy.totp.verify({
      secret: otpData.secret,
      encoding: 'base32',
      token,
      step: 300,
      window: 1
    });

    if (isValid) {
      this.otpStore.delete(token); // OTP is one-time use
    }

    return isValid;
  }

  private cleanupExpiredOTPs(): void {
    const now = Date.now();
    for (const [token, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(token);
      }
    }
  }
}
