/**
 * SMS OTP Helper (Mock)
 */

// In-memory store for OTPs (In production, use Redis or a database table with TTL)
const otpStore = new Map<string, { code: string; expires: number }>();

export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendSMS = async (phone: string, message: string): Promise<boolean> => {
    console.log(`[SMS MOCK] Sending to ${phone}: ${message}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
};

export const storeOTP = (phone: string, code: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    otpStore.set(cleanPhone, {
        code,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
};

export const verifyOTP = (phone: string, code: string): boolean => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const entry = otpStore.get(cleanPhone);

    if (!entry) return false;
    if (Date.now() > entry.expires) {
        otpStore.delete(cleanPhone);
        return false;
    }

    const isValid = entry.code === code;
    if (isValid) {
        otpStore.delete(cleanPhone); // One-time use
    }
    return isValid;
};
