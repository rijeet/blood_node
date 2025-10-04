// CAPTCHA service for Blood Node
import { CAPTCHA_SETTINGS } from '@/lib/models/security';

export interface CaptchaResult {
  success: boolean;
  score?: number;
  error?: string;
}

export interface CaptchaConfig {
  siteKey: string;
  secretKey: string;
  minScore: number;
  action: string;
}

export class CaptchaService {
  private static instance: CaptchaService;
  private config: CaptchaConfig | null = null;

  static getInstance(): CaptchaService {
    if (!CaptchaService.instance) {
      CaptchaService.instance = new CaptchaService();
    }
    return CaptchaService.instance;
  }

  /**
   * Initialize CAPTCHA configuration
   */
  initialize(config: CaptchaConfig): void {
    this.config = config;
  }

  /**
   * Verify reCAPTCHA v3 token
   */
  async verifyRecaptchaV3(token: string, action: string): Promise<CaptchaResult> {
    if (!this.config) {
      return { success: false, error: 'CAPTCHA not configured' };
    }

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: this.config.secretKey,
          response: token,
          remoteip: '127.0.0.1' // In production, use actual client IP
        })
      });

      const data = await response.json();

      if (!data.success) {
        return {
          success: false,
          error: 'CAPTCHA verification failed',
          score: data.score || 0
        };
      }

      // Check if action matches
      if (data.action !== action) {
        return {
          success: false,
          error: 'CAPTCHA action mismatch',
          score: data.score || 0
        };
      }

      // Check score threshold
      const score = data.score || 0;
      if (score < this.config.minScore) {
        return {
          success: false,
          error: `CAPTCHA score too low: ${score}`,
          score
        };
      }

      return {
        success: true,
        score
      };
    } catch (error) {
      console.error('CAPTCHA verification error:', error);
      return {
        success: false,
        error: 'CAPTCHA verification failed due to network error'
      };
    }
  }

  /**
   * Verify hCaptcha token
   */
  async verifyHCaptcha(token: string): Promise<CaptchaResult> {
    if (!this.config) {
      return { success: false, error: 'CAPTCHA not configured' };
    }

    try {
      const response = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: this.config.secretKey,
          response: token,
          remoteip: '127.0.0.1' // In production, use actual client IP
        })
      });

      const data = await response.json();

      return {
        success: data.success || false,
        error: data.success ? undefined : 'CAPTCHA verification failed'
      };
    } catch (error) {
      console.error('hCaptcha verification error:', error);
      return {
        success: false,
        error: 'CAPTCHA verification failed due to network error'
      };
    }
  }

  /**
   * Verify CAPTCHA token (auto-detect provider)
   */
  async verifyCaptcha(token: string, action?: string): Promise<CaptchaResult> {
    if (!this.config) {
      return { success: false, error: 'CAPTCHA not configured' };
    }

    const provider = process.env.CAPTCHA_PROVIDER || 'recaptcha_v3';
    
    switch (provider) {
      case 'recaptcha_v3':
        return await this.verifyRecaptchaV3(token, action || 'login');
      case 'hcaptcha':
        return await this.verifyHCaptcha(token);
      default:
        return { success: false, error: 'Unsupported CAPTCHA provider' };
    }
  }

  /**
   * Check if CAPTCHA is required for action
   */
  isCaptchaRequired(action: 'login' | 'registration' | 'password_reset' | 'admin_login'): boolean {
    switch (action) {
      case 'login':
        return CAPTCHA_SETTINGS.ENABLE_AFTER_ATTEMPTS > 0 && CAPTCHA_SETTINGS.ENABLE_AFTER_ATTEMPTS <= 2; // Only if threshold is low
      case 'registration':
        return CAPTCHA_SETTINGS.REQUIRED_FOR_REGISTRATION;
      case 'password_reset':
        return CAPTCHA_SETTINGS.REQUIRED_FOR_PASSWORD_RESET;
      case 'admin_login':
        return CAPTCHA_SETTINGS.REQUIRED_FOR_ADMIN_LOGIN;
      default:
        return false;
    }
  }

  /**
   * Get CAPTCHA site key for frontend
   */
  getSiteKey(): string | null {
    return this.config?.siteKey || process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || null;
  }

  /**
   * Generate CAPTCHA challenge (for custom implementation)
   */
  generateChallenge(): { question: string; answer: string } {
    const challenges = [
      { question: 'What is 2 + 3?', answer: '5' },
      { question: 'What is the capital of France?', answer: 'Paris' },
      { question: 'What color is the sky?', answer: 'Blue' },
      { question: 'How many days are in a week?', answer: '7' },
      { question: 'What is 10 - 4?', answer: '6' }
    ];

    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    return randomChallenge;
  }

  /**
   * Verify custom CAPTCHA challenge
   */
  verifyChallenge(question: string, answer: string, userAnswer: string): boolean {
    // Simple case-insensitive comparison
    return answer.toLowerCase().trim() === userAnswer.toLowerCase().trim();
  }
}

/**
 * Initialize CAPTCHA service
 */
export function initializeCaptcha(): void {
  const captchaService = CaptchaService.getInstance();
  
  const config: CaptchaConfig = {
    siteKey: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || '',
    secretKey: process.env.CAPTCHA_SECRET_KEY || '',
    minScore: parseFloat(process.env.CAPTCHA_MIN_SCORE || '0.5'),
    action: 'login'
  };

  captchaService.initialize(config);
}

/**
 * Get CAPTCHA configuration for frontend
 */
export function getCaptchaConfig() {
  return {
    siteKey: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,
    provider: process.env.CAPTCHA_PROVIDER || 'recaptcha_v3',
    minScore: parseFloat(process.env.CAPTCHA_MIN_SCORE || '0.5'),
    enabled: process.env.CAPTCHA_ENABLED === 'true'
  };
}
