export {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  EMAIL_VERIFY_MAX_AGE_SECONDS,
  type SessionUser,
  type SessionPayload,
  type RegisterSellerInput,
  type CompleteGoogleShopInput,
  type GoogleProfile,
  type LoginInput,
  AuthError,
} from "./types";

export {
  createSessionToken,
  createEmailVerificationToken,
  verifySessionToken,
  verifyEmailToken,
  getSessionFromRequest,
  readSessionCookie,
  sessionCookieHeader,
  clearSessionCookieHeader,
  getSessionCookieOptions,
} from "./session";

export {
  registerSeller,
  loginUser,
  verifyUserEmail,
  getUserSessionById,
  isSlugAvailable,
  sendVerificationEmail,
  authenticateGoogleUser,
  completeGoogleShopSetup,
  normalizeSlug,
  slugFromShopName,
  validateSlug,
} from "./service";

export {
  createGoogleOAuthClient,
  getGoogleAuthUrl,
  getGoogleProfileFromCode,
  getGoogleRedirectUri,
  isGoogleAuthConfigured,
} from "./google";

export { hashPassword, verifyPassword, validatePasswordStrength } from "./password";
