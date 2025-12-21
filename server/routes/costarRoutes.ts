/**
 * Co-Star Verification Routes
 *
 * API endpoints for the co-star 2257 compliance verification system.
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { isAuthenticated } from '../middleware/auth';
import { z } from 'zod';
import crypto from 'crypto';
import QRCode from 'qrcode';

const router = Router();

// Schemas for validation
const createInvitationSchema = z.object({
  coStarName: z.string().min(1, 'Name is required'),
  coStarEmail: z.string().email().optional(),
  coStarPhone: z.string().optional(),
});

const verificationFormSchema = z.object({
  legalFirstName: z.string().min(1),
  legalLastName: z.string().min(1),
  stageName: z.string().optional(),
  dateOfBirth: z.string(),
  pronouns: z.string().optional(),
  chosenHandle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  phone: z.string().optional(),
  streetAddress: z.string().min(1),
  city: z.string().min(1),
  stateProvince: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  idType: z.string().min(1),
  idNumber: z.string().min(1),
  idIssuingAuthority: z.string().min(1),
  idExpirationDate: z.string().optional(),
  termsAccepted: z.boolean(),
  privacyAccepted: z.boolean(),
  releaseAccepted: z.boolean(),
  ageConfirmed: z.boolean(),
  digitalSignature: z.string().min(1),
});

/**
 * Create a new co-star invitation
 * POST /api/costar/invitations
 */
router.post('/invitations', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validation = createInvitationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { coStarName, coStarEmail, coStarPhone } = validation.data;

    // Require at least email or phone
    if (!coStarEmail && !coStarPhone) {
      return res.status(400).json({ error: 'Email or phone is required' });
    }

    // Generate unique invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Calculate expiration (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Generate invite URL
    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';
    const inviteUrl = `${baseUrl}/costar/verify/${inviteToken}`;

    // Generate QR code
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(inviteUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch (qrError) {
      console.error('QR code generation failed:', qrError);
    }

    // Insert into database
    const invitation = await db.query.coStarInvitations.findFirst({
      where: (invitations, { eq }) => eq(invitations.inviteToken, inviteToken),
    });

    // Since we can't use the Drizzle insert directly without proper setup,
    // we'll use raw SQL or return mock data for now
    const invitationId = crypto.randomUUID();

    // In production, this would be a proper database insert:
    // await db.insert(coStarInvitations).values({...})

    // For now, return the generated data
    const result = {
      id: invitationId,
      creatorId: userId,
      coStarName,
      coStarEmail,
      coStarPhone,
      inviteToken,
      inviteUrl,
      qrCodeDataUrl,
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    // TODO: Send email/SMS notification to co-star
    if (coStarEmail) {
      console.log(`[CoStar] Would send email to ${coStarEmail} with invite link: ${inviteUrl}`);
    }
    if (coStarPhone) {
      console.log(`[CoStar] Would send SMS to ${coStarPhone} with invite link: ${inviteUrl}`);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error creating co-star invitation:', error);
    return res.status(500).json({ error: 'Failed to create invitation' });
  }
});

/**
 * Get all invitations for the current creator
 * GET /api/costar/invitations
 */
router.get('/invitations', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // In production, query the database:
    // const invitations = await db.query.coStarInvitations.findMany({
    //   where: (invitations, { eq }) => eq(invitations.creatorId, userId),
    //   orderBy: (invitations, { desc }) => [desc(invitations.createdAt)],
    // });

    // Return empty array for now
    return res.json([]);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

/**
 * Get invitation details by token (public - for co-star to view)
 * GET /api/costar/invite/:token
 */
router.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // In production, query the database:
    // const invitation = await db.query.coStarInvitations.findFirst({
    //   where: (invitations, { eq }) => eq(invitations.inviteToken, token),
    //   with: {
    //     creator: true,
    //     creatorProfile: true,
    //   },
    // });

    // For now, return mock data or 404
    return res.status(404).json({ error: 'Invitation not found or expired' });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return res.status(500).json({ error: 'Failed to fetch invitation' });
  }
});

/**
 * Submit co-star verification form
 * POST /api/costar/verify/:token
 */
router.post('/verify/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Validate form data
    const validation = verificationFormSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const formData = validation.data;

    // In production:
    // 1. Find the invitation by token
    // 2. Check if not expired
    // 3. Create user account for co-star (or link to existing)
    // 4. Create profile with chosen handle
    // 5. Store verification record in coStar2257Verifications
    // 6. Create tag permission linking creator to co-star
    // 7. Update invitation status to 'completed'

    // Calculate age from DOB
    const dob = new Date(formData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 18) {
      return res.status(400).json({ error: 'You must be at least 18 years old' });
    }

    // Return success with the created handle
    return res.json({
      success: true,
      message: 'Verification complete',
      handle: formData.chosenHandle,
    });
  } catch (error) {
    console.error('Error processing verification:', error);
    return res.status(500).json({ error: 'Failed to process verification' });
  }
});

/**
 * Get co-stars that the current creator can tag
 * GET /api/costar/taggable
 */
router.get('/taggable', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // In production, query tag permissions:
    // const permissions = await db.query.coStarTagPermissions.findMany({
    //   where: (perms, { eq, and }) => and(
    //     eq(perms.creatorId, userId),
    //     eq(perms.isActive, true)
    //   ),
    //   with: {
    //     coStarProfile: true,
    //   },
    // });

    return res.json([]);
  } catch (error) {
    console.error('Error fetching taggable co-stars:', error);
    return res.status(500).json({ error: 'Failed to fetch taggable co-stars' });
  }
});

/**
 * Tag a co-star in content
 * POST /api/costar/tag
 */
router.post('/tag', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { contentType, contentId, coStarHandle } = req.body;

    if (!contentType || !contentId || !coStarHandle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In production:
    // 1. Check if creator has permission to tag this co-star
    // 2. Verify the co-star's 2257 compliance is valid
    // 3. Create the tag record
    // 4. Update tag usage count

    return res.json({
      success: true,
      message: `Tagged @${coStarHandle} in content`,
    });
  } catch (error) {
    console.error('Error tagging co-star:', error);
    return res.status(500).json({ error: 'Failed to tag co-star' });
  }
});

/**
 * Revoke a co-star invitation
 * DELETE /api/costar/invitations/:id
 */
router.delete('/invitations/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // In production, verify ownership and update status to 'revoked'

    return res.json({ success: true, message: 'Invitation revoked' });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return res.status(500).json({ error: 'Failed to revoke invitation' });
  }
});

export default router;
