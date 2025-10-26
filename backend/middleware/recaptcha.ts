import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

// reCAPTCHA configuration
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"; // Default test key
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

// reCAPTCHA verification function
export async function verifyRecaptcha(token: string, remoteip?: string): Promise<boolean> {
  try {
    const response = await axios.post(RECAPTCHA_VERIFY_URL, null, {
      params: {
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
        remoteip: remoteip
      }
    });

    const { success, score } = response.data;
    
    // For reCAPTCHA v2, we only check success
    // For reCAPTCHA v3, we would also check score (typically > 0.5)
    return success === true;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

// reCAPTCHA middleware
export function validateRecaptcha(req: Request, res: Response, next: NextFunction) {
  const { recaptchaToken } = req.body;
  
  if (!recaptchaToken) {
    return res.status(400).json({ message: "reCAPTCHA token is required" });
  }

  verifyRecaptcha(recaptchaToken, req.ip)
    .then(isValid => {
      if (!isValid) {
        return res.status(400).json({ message: "reCAPTCHA verification failed" });
      }
      next();
    })
    .catch(() => {
      return res.status(400).json({ message: "reCAPTCHA verification failed" });
    });
}
