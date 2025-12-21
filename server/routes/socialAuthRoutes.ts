/**
 * Social Authentication Routes
 *
 * OAuth2 authentication routes for Google, GitHub, Facebook, Twitter, and Discord.
 * Handles both login and signup flows with role assignment.
 */

import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { storage } from '../storage';
import crypto from 'crypto';

const router = Router();

// Get base URL for callbacks
const getBaseUrl = () => {
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  }
  return process.env.BASE_URL || 'http://localhost:5000';
};

// OAuth provider configurations
const oauthProviders = {
  google: {
    Strategy: GoogleStrategy,
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    scope: ['profile', 'email'],
    callbackURL: '/auth/google/callback',
    profileFields: (profile: any) => ({
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      displayName: profile.displayName,
      profileImageUrl: profile.photos?.[0]?.value,
    }),
  },
  github: {
    Strategy: GitHubStrategy,
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
    scope: ['user:email'],
    callbackURL: '/auth/github/callback',
    profileFields: (profile: any) => ({
      providerId: String(profile.id),
      email: profile.emails?.[0]?.value || profile._json?.email,
      firstName: profile.displayName?.split(' ')[0],
      lastName: profile.displayName?.split(' ').slice(1).join(' '),
      displayName: profile.username || profile.displayName,
      profileImageUrl: profile.photos?.[0]?.value || profile._json?.avatar_url,
    }),
  },
  facebook: {
    Strategy: FacebookStrategy,
    clientIdEnv: 'FACEBOOK_CLIENT_ID',
    clientSecretEnv: 'FACEBOOK_CLIENT_SECRET',
    scope: ['email', 'public_profile'],
    callbackURL: '/auth/facebook/callback',
    profileFields: (profile: any) => ({
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      firstName: profile._json?.first_name,
      lastName: profile._json?.last_name,
      displayName: profile.displayName,
      profileImageUrl: profile.photos?.[0]?.value,
    }),
  },
  twitter: {
    Strategy: TwitterStrategy,
    clientIdEnv: 'TWITTER_CONSUMER_KEY',
    clientSecretEnv: 'TWITTER_CONSUMER_SECRET',
    scope: [],
    callbackURL: '/auth/twitter/callback',
    profileFields: (profile: any) => ({
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      firstName: profile.displayName?.split(' ')[0],
      lastName: profile.displayName?.split(' ').slice(1).join(' '),
      displayName: profile.username,
      profileImageUrl: profile.photos?.[0]?.value,
    }),
  },
  discord: {
    Strategy: DiscordStrategy,
    clientIdEnv: 'DISCORD_CLIENT_ID',
    clientSecretEnv: 'DISCORD_CLIENT_SECRET',
    scope: ['identify', 'email'],
    callbackURL: '/auth/discord/callback',
    profileFields: (profile: any) => ({
      providerId: profile.id,
      email: profile.email,
      firstName: profile.username,
      lastName: '',
      displayName: profile.username,
      profileImageUrl: profile.avatar
        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
        : null,
    }),
  },
};

// Generate unique username
async function generateUniqueUsername(base: string): Promise<string> {
  // Clean the base username
  let username = base
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);

  if (!username) {
    username = 'user';
  }

  // Check if username is taken
  let existingUser = await storage.getUserByUsername(username);

  if (!existingUser) {
    return username;
  }

  // Add random suffix
  for (let i = 0; i < 10; i++) {
    const suffix = crypto.randomBytes(3).toString('hex');
    const newUsername = `${username}_${suffix}`;
    existingUser = await storage.getUserByUsername(newUsername);

    if (!existingUser) {
      return newUsername;
    }
  }

  // Fallback to UUID-based username
  return `user_${crypto.randomUUID().slice(0, 8)}`;
}

// Initialize OAuth strategies
export function initializeSocialStrategies() {
  const baseUrl = getBaseUrl();

  Object.entries(oauthProviders).forEach(([provider, config]) => {
    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];

    if (!clientId || !clientSecret) {
      console.log(`[OAuth] ${provider} not configured (missing ${config.clientIdEnv} or ${config.clientSecretEnv})`);
      return;
    }

    console.log(`[OAuth] Initializing ${provider} strategy with callback: ${baseUrl}${config.callbackURL}`);

    const strategyOptions: any = {
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: `${baseUrl}${config.callbackURL}`,
    };

    // Twitter uses consumerKey/consumerSecret
    if (provider === 'twitter') {
      strategyOptions.consumerKey = clientId;
      strategyOptions.consumerSecret = clientSecret;
      delete strategyOptions.clientID;
      delete strategyOptions.clientSecret;
    }

    // Add profile fields for Facebook
    if (provider === 'facebook') {
      strategyOptions.profileFields = ['id', 'emails', 'name', 'displayName', 'photos'];
    }

    // Add scope for Discord
    if (provider === 'discord') {
      strategyOptions.scope = config.scope;
    }

    try {
      passport.use(
        provider,
        new config.Strategy(
          strategyOptions,
          async (
            accessToken: string,
            refreshToken: string,
            profile: any,
            done: (error: any, user?: any) => void
          ) => {
            try {
              const profileData = config.profileFields(profile);
              console.log(`[OAuth] ${provider} profile:`, {
                providerId: profileData.providerId,
                email: profileData.email,
                displayName: profileData.displayName
              });

              // Check if this social account already exists
              const existingSocialAccount = await storage.getSocialAccountByProvider(provider, profileData.providerId);

              if (existingSocialAccount) {
                // Get the associated user
                const user = await storage.getUser(existingSocialAccount.userId);
                if (user) {
                  console.log(`[OAuth] Found existing user for ${provider}:`, user.id);
                  return done(null, user);
                }
              }

              // Check if user exists with this email
              let user = profileData.email ? await storage.getUserByEmail(profileData.email) : undefined;

              if (user) {
                // Link social account to existing user
                console.log(`[OAuth] Linking ${provider} to existing user:`, user.id);
                await storage.createSocialAccount({
                  userId: user.id,
                  provider: provider,
                  providerId: profileData.providerId,
                  email: profileData.email,
                  displayName: profileData.displayName,
                  profileImageUrl: profileData.profileImageUrl,
                  accessToken: accessToken,
                  refreshToken: refreshToken,
                });
                return done(null, user);
              }

              // Create new user
              const username = await generateUniqueUsername(
                profileData.displayName || profileData.email?.split('@')[0] || 'user'
              );

              console.log(`[OAuth] Creating new user for ${provider}:`, username);

              user = await storage.createUser({
                username,
                email: profileData.email || `${provider}_${profileData.providerId}@social.fanz.website`,
                password: '', // Empty password for social auth (not null, as schema requires it)
                firstName: profileData.firstName || null,
                lastName: profileData.lastName || null,
                profileImageUrl: profileData.profileImageUrl || null,
                authProvider: 'social',
                role: 'fan', // Default role
                status: 'active',
                onlineStatus: false,
                lastSeenAt: new Date(),
              });

              // Create social account link
              await storage.createSocialAccount({
                userId: user.id,
                provider: provider,
                providerId: profileData.providerId,
                email: profileData.email,
                displayName: profileData.displayName,
                profileImageUrl: profileData.profileImageUrl,
                accessToken: accessToken,
                refreshToken: refreshToken,
              });

              done(null, user);
            } catch (error) {
              console.error(`[OAuth] ${provider} authentication error:`, error);
              done(error);
            }
          }
        )
      );
    } catch (error) {
      console.error(`[OAuth] Failed to initialize ${provider} strategy:`, error);
    }
  });
}

// Create routes for each provider
Object.keys(oauthProviders).forEach((provider) => {
  const config = oauthProviders[provider as keyof typeof oauthProviders];

  // Initiate OAuth flow
  router.get(
    `/${provider}`,
    (req: Request, res: Response, next: NextFunction) => {
      // Store role in session if provided (for signup flow)
      if (req.query.role) {
        (req.session as any).signupRole = req.query.role;
      }

      // Check if provider is configured
      if (!process.env[config.clientIdEnv]) {
        console.log(`[OAuth] ${provider} not configured`);
        return res.redirect(`/auth/login?error=${provider}_not_configured`);
      }
      next();
    },
    passport.authenticate(provider, { scope: config.scope })
  );

  // OAuth callback
  router.get(
    `/${provider}/callback`,
    (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate(provider, { failureRedirect: '/auth/login?error=oauth_failed' })(
        req,
        res,
        (err: any) => {
          if (err) {
            console.error(`[OAuth] ${provider} callback error:`, err);
            return res.redirect('/auth/login?error=oauth_failed');
          }
          next();
        }
      );
    },
    async (req: Request, res: Response) => {
      try {
        const user = req.user as any;

        if (!user) {
          console.log(`[OAuth] No user after ${provider} auth`);
          return res.redirect('/auth/login?error=oauth_failed');
        }

        // Check if role upgrade is needed (from signup flow)
        const signupRole = (req.session as any).signupRole;
        if (signupRole && signupRole === 'creator' && user.role === 'fan') {
          await storage.updateUserRole(user.id, 'creator');
        }

        // Clear signup role from session
        delete (req.session as any).signupRole;

        // Log in the user (passport session)
        req.login(user, (err) => {
          if (err) {
            console.error(`[OAuth] Login error after ${provider} auth:`, err);
            return res.redirect('/auth/login?error=login_failed');
          }

          console.log(`[OAuth] ${provider} login successful for user:`, user.id);

          // Redirect to dashboard or home
          res.redirect('/');
        });
      } catch (error) {
        console.error(`[OAuth] ${provider} callback processing error:`, error);
        res.redirect('/auth/login?error=oauth_failed');
      }
    }
  );
});

// Status endpoint to check which providers are configured
router.get('/status', (req: Request, res: Response) => {
  const providerStatus: Record<string, boolean> = {};

  Object.entries(oauthProviders).forEach(([provider, config]) => {
    providerStatus[provider] = !!(process.env[config.clientIdEnv] && process.env[config.clientSecretEnv]);
  });

  res.json({
    providers: providerStatus,
    configured: Object.entries(providerStatus)
      .filter(([, configured]) => configured)
      .map(([provider]) => provider),
  });
});

export default router;
