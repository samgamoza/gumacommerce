export const AUTH_COOKIE_NAME = "gumacommerce_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const EMAIL_VERIFY_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

export interface SessionUser {
  userId: string;
  email: string;
  role: string;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  displayName: string;
  emailVerified: boolean;
  needsShopSetup: boolean;
  /** Mirrors users.session_version; tokens with an older value are revoked. */
  sessionVersion: number;
}

export interface SessionPayload extends SessionUser {
  iat: number;
  exp: number;
}

export interface RegisterSellerInput {
  email: string;
  password: string;
  displayName: string;
  shopName: string;
  shopSlug: string;
  category?: string;
  /** Brand vibe chosen at signup — seeds a unique starting theme. */
  vibe?: string;
}

export interface CompleteGoogleShopInput {
  userId: string;
  shopName: string;
  shopSlug: string;
  category?: string;
  /** Brand vibe chosen at signup — seeds a unique starting theme. */
  vibe?: string;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  emailVerified: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code:
      | "INVALID_CREDENTIALS"
      | "EMAIL_TAKEN"
      | "SLUG_TAKEN"
      | "SLUG_INVALID"
      | "WEAK_PASSWORD"
      | "USER_NOT_FOUND"
      | "INVALID_TOKEN"
      | "VALIDATION"
      | "USE_GOOGLE"
      | "SHOP_ALREADY_SETUP"
      | "ACCOUNT_SUSPENDED"
  ) {
    super(message);
    this.name = "AuthError";
  }
}
