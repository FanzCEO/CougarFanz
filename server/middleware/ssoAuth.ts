/**
 * FanzSSO Server Authentication Middleware
 * Validates tokens and attaches user to request
 */

import { Request, Response, NextFunction } from 'express';

const SSO_URL = process.env.FANZ_SSO_URL || 'https://sso.fanz.foundation';

export interface SSOUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  platform_access: string[];
  creator_status?: string;
  age_verified: boolean;
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: SSOUser;
  token?: string;
}

/**
 * Validate token with FanzSSO service
 */
async function validateToken(token: string): Promise<{ valid: boolean; user?: SSOUser }> {
  try {
    const response = await fetch(`${SSO_URL}/auth/validate`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      return { valid: false };
    }

    return response.json();
  } catch (error) {
    console.error('SSO validation error:', error);
    return { valid: false };
  }
}

/**
 * Extract token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !token) return null;

  return token;
}

/**
 * Require authentication middleware
 * Validates token and attaches user to request
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
    return;
  }

  const validation = await validateToken(token);

  if (!validation.valid || !validation.user) {
    res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    return;
  }

  req.user = validation.user;
  req.token = token;
  next();
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (token) {
    const validation = await validateToken(token);
    if (validation.valid && validation.user) {
      req.user = validation.user;
      req.token = token;
    }
  }

  next();
}

/**
 * Require age verification middleware
 * Must be used after requireAuth
 */
export function requireAgeVerification(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'NO_USER' });
    return;
  }

  if (!req.user.age_verified) {
    res.status(403).json({
      error: 'Age verification required',
      code: 'AGE_NOT_VERIFIED',
      verifyUrl: `${SSO_URL}/verify/age`
    });
    return;
  }

  next();
}

/**
 * Require specific role middleware
 * Must be used after requireAuth
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'NO_USER' });
      return;
    }

    const hasRole = roles.some(role =>
      req.user!.roles.includes(role) || req.user!.roles.includes('admin')
    );

    if (!hasRole) {
      res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: roles
      });
      return;
    }

    next();
  };
}

/**
 * Require platform access middleware
 * Must be used after requireAuth
 */
export function requirePlatformAccess(platformId: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'NO_USER' });
      return;
    }

    const hasAccess = req.user.platform_access.includes(platformId) ||
                      req.user.platform_access.includes('all');

    if (!hasAccess) {
      res.status(403).json({
        error: 'Platform access required',
        code: 'NO_PLATFORM_ACCESS',
        platform: platformId,
        subscribeUrl: `${SSO_URL}/subscribe/${platformId}`
      });
      return;
    }

    next();
  };
}

/**
 * Require creator status middleware
 * Must be used after requireAuth
 */
export function requireCreator(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'NO_USER' });
    return;
  }

  if (!req.user.creator_status || req.user.creator_status === 'none') {
    res.status(403).json({
      error: 'Creator account required',
      code: 'NOT_CREATOR',
      applyUrl: `${SSO_URL}/creator/apply`
    });
    return;
  }

  next();
}

/**
 * Require verified creator status
 * Must be used after requireAuth
 */
export function requireVerifiedCreator(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'NO_USER' });
    return;
  }

  if (req.user.creator_status !== 'verified') {
    res.status(403).json({
      error: 'Verified creator account required',
      code: 'CREATOR_NOT_VERIFIED',
      status: req.user.creator_status,
      verifyUrl: `${SSO_URL}/creator/verify`
    });
    return;
  }

  next();
}
