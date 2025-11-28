import { db } from './db';
import { 
  loanListings, 
  loanOffers, 
  activeLoans, 
  loanPayments, 
  loanCollateral,
  users 
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export type LoanListing = typeof loanListings.$inferSelect;
export type LoanOffer = typeof loanOffers.$inferSelect;
export type ActiveLoan = typeof activeLoans.$inferSelect;
export type LoanPayment = typeof loanPayments.$inferSelect;
export type LoanCollateral = typeof loanCollateral.$inferSelect;

class MicrolendingService {
  async createLoanListing(data: Partial<LoanListing>): Promise<LoanListing> {
    const creditScore = await this.calculateCreditScore(data.creatorId!);
    const riskLevel = this.calculateRiskLevel(creditScore);

    const [listing] = await db.insert(loanListings).values({
      ...data,
      creditScore,
      riskLevel,
    } as any).returning();

    return listing;
  }

  async getCreatorListings(creatorId: string): Promise<LoanListing[]> {
    return db
      .select()
      .from(loanListings)
      .where(eq(loanListings.creatorId, creatorId))
      .orderBy(desc(loanListings.createdAt));
  }

  async getActiveListings(): Promise<LoanListing[]> {
    return db
      .select()
      .from(loanListings)
      .where(eq(loanListings.status, 'active'))
      .orderBy(desc(loanListings.createdAt));
  }

  async getListing(id: string): Promise<LoanListing | undefined> {
    const [listing] = await db
      .select()
      .from(loanListings)
      .where(eq(loanListings.id, id));
    return listing;
  }

  async updateListing(id: string, data: Partial<LoanListing>): Promise<void> {
    await db
      .update(loanListings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(loanListings.id, id));
  }

  async deleteListing(id: string): Promise<void> {
    await db
      .update(loanListings)
      .set({ status: 'cancelled' })
      .where(eq(loanListings.id, id));
  }

  async createOffer(data: Partial<LoanOffer>): Promise<LoanOffer> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [offer] = await db.insert(loanOffers).values({
      ...data,
      expiresAt,
    } as any).returning();

    await db
      .update(loanListings)
      .set({
        totalOffered: sql`${loanListings.totalOffered} + ${data.amount}`,
        offerCount: sql`${loanListings.offerCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(loanListings.id, data.listingId!));

    return offer;
  }

  async getListingOffers(listingId: string): Promise<LoanOffer[]> {
    return db
      .select()
      .from(loanOffers)
      .where(eq(loanOffers.listingId, listingId))
      .orderBy(desc(loanOffers.createdAt));
  }

  async getLenderOffers(lenderId: string): Promise<LoanOffer[]> {
    return db
      .select()
      .from(loanOffers)
      .where(eq(loanOffers.lenderId, lenderId))
      .orderBy(desc(loanOffers.createdAt));
  }

  async getOffer(id: string): Promise<LoanOffer | undefined> {
    const [offer] = await db
      .select()
      .from(loanOffers)
      .where(eq(loanOffers.id, id));
    return offer;
  }

  async updateOffer(id: string, status: string): Promise<void> {
    await db
      .update(loanOffers)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(loanOffers.id, id));
  }

  async acceptOffer(offerId: string): Promise<ActiveLoan> {
    const offer = await this.getOffer(offerId);
    if (!offer) {
      throw new Error('Offer not found');
    }

    const listing = await this.getListing(offer.listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    await this.updateOffer(offerId, 'accepted');

    const otherOffers = await this.getListingOffers(offer.listingId);
    for (const otherOffer of otherOffers) {
      if (otherOffer.id !== offerId && otherOffer.status === 'pending') {
        await this.updateOffer(otherOffer.id, 'rejected');
      }
    }

    const interestRate = parseFloat(offer.proposedInterestRate?.toString() || listing.interestRate.toString());
    const termMonths = offer.proposedTermMonths || listing.termMonths;
    const amount = parseFloat(offer.amount.toString());

    const monthlyPayment = this.calculateMonthlyPayment(amount, interestRate, termMonths);
    const totalRepayment = monthlyPayment * termMonths;

    const nextPaymentDue = new Date();
    nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);

    const [loan] = await db.insert(activeLoans).values({
      listingId: listing.id,
      offerId: offer.id,
      creatorId: listing.creatorId,
      lenderId: offer.lenderId,
      principalAmount: offer.amount,
      interestRate: interestRate.toString(),
      termMonths,
      monthlyPayment: monthlyPayment.toString(),
      totalRepayment: totalRepayment.toString(),
      remainingBalance: totalRepayment.toString(),
      nextPaymentDue,
      paymentsRemaining: termMonths,
      collateralType: listing.collateralType,
      collateralDetails: listing.collateralDescription ? {
        description: listing.collateralDescription,
        value: listing.collateralValue?.toString(),
      } : {},
    } as any).returning();

    if (listing.collateralType !== 'none') {
      await db.insert(loanCollateral).values({
        loanId: loan.id,
        collateralType: listing.collateralType,
        valuationAmount: listing.collateralValue || '0',
        earningsPercentage: listing.collateralType === 'revenue_share' ? '15' : null,
        earningsMonths: listing.collateralType === 'future_earnings' ? termMonths : null,
        contentRightsDetails: listing.collateralType === 'content_rights' ? {
          description: listing.collateralDescription,
        } : null,
        equipmentDetails: listing.collateralType === 'equipment' ? {
          description: listing.collateralDescription,
        } : null,
      } as any);
    }

    await this.updateListing(listing.id, { status: 'funded' });

    return loan;
  }

  async getCreatorLoans(creatorId: string): Promise<ActiveLoan[]> {
    return db
      .select()
      .from(activeLoans)
      .where(eq(activeLoans.creatorId, creatorId))
      .orderBy(desc(activeLoans.createdAt));
  }

  async getLenderLoans(lenderId: string): Promise<ActiveLoan[]> {
    return db
      .select()
      .from(activeLoans)
      .where(eq(activeLoans.lenderId, lenderId))
      .orderBy(desc(activeLoans.createdAt));
  }

  async getLoan(id: string): Promise<ActiveLoan | undefined> {
    const [loan] = await db
      .select()
      .from(activeLoans)
      .where(eq(activeLoans.id, id));
    return loan;
  }

  async makePayment(loanId: string, amount: number): Promise<LoanPayment> {
    const loan = await this.getLoan(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    const loanAmount = parseFloat(amount.toString());
    const remainingBalance = parseFloat(loan.remainingBalance.toString());
    const monthlyPayment = parseFloat(loan.monthlyPayment.toString());
    const interestRate = parseFloat(loan.interestRate.toString()) / 100 / 12;

    const now = new Date();
    const dueDate = loan.nextPaymentDue || now;
    const daysLate = now > dueDate ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const lateFee = daysLate > (loan.gracePeriodDays || 7) ? daysLate * 5 : 0;

    const balanceWithLateFee = remainingBalance + lateFee;

    const interestAmount = remainingBalance * interestRate;
    const principalAmount = Math.max(0, loanAmount - interestAmount - lateFee);

    const newBalance = balanceWithLateFee - loanAmount;
    const totalPaid = parseFloat((loan.amountPaid || '0').toString()) + loanAmount;

    let paymentType: 'scheduled' | 'early' | 'late' | 'partial' | 'final' = 'scheduled';
    if (loanAmount < monthlyPayment) {
      paymentType = 'partial';
    } else if (loanAmount > monthlyPayment) {
      paymentType = 'early';
    } else if (newBalance <= 0) {
      paymentType = 'final';
    }
    
    if (daysLate > (loan.gracePeriodDays || 7)) {
      paymentType = 'late';
    }

    const [payment] = await db.insert(loanPayments).values({
      loanId,
      amount: loanAmount.toString(),
      principalAmount: principalAmount.toString(),
      interestAmount: interestAmount.toString(),
      paymentType,
      status: 'completed',
      dueDate,
      paidAt: now,
      lateFee: lateFee.toString(),
      daysLate,
    } as any).returning();

    const nextPaymentDue = new Date(dueDate);
    nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);

    const currentTotalRepayment = parseFloat(loan.totalRepayment.toString());
    const newTotalRepayment = lateFee > 0 ? (currentTotalRepayment + lateFee).toString() : loan.totalRepayment.toString();

    await db
      .update(activeLoans)
      .set({
        amountPaid: totalPaid.toString(),
        remainingBalance: Math.max(0, newBalance).toString(),
        totalRepayment: newTotalRepayment,
        nextPaymentDue: newBalance > 0 ? nextPaymentDue : null,
        paymentsRemaining: Math.max(0, (loan.paymentsRemaining || 0) - 1),
        status: newBalance <= 0 ? 'paid_off' : 'active',
        latePaymentCount: daysLate > (loan.gracePeriodDays || 7) ? (loan.latePaymentCount || 0) + 1 : loan.latePaymentCount,
        updatedAt: now,
      })
      .where(eq(activeLoans.id, loanId));

    if (newBalance <= 0) {
      await db
        .update(loanCollateral)
        .set({
          status: 'released',
          releaseDate: now,
        })
        .where(eq(loanCollateral.loanId, loanId));
    }

    return payment;
  }

  async getLoanPayments(loanId: string): Promise<LoanPayment[]> {
    return db
      .select()
      .from(loanPayments)
      .where(eq(loanPayments.loanId, loanId))
      .orderBy(desc(loanPayments.createdAt));
  }

  async markLoanAsDefaulted(loanId: string, reason: string): Promise<void> {
    const now = new Date();
    
    await db
      .update(activeLoans)
      .set({
        status: 'defaulted',
        defaultedAt: now,
        defaultReason: reason,
        updatedAt: now,
      })
      .where(eq(activeLoans.id, loanId));

    await db
      .update(loanCollateral)
      .set({
        status: 'seized',
        seizureDate: now,
      })
      .where(eq(loanCollateral.loanId, loanId));
  }

  async getLoanCollateral(loanId: string): Promise<LoanCollateral[]> {
    return db
      .select()
      .from(loanCollateral)
      .where(eq(loanCollateral.loanId, loanId));
  }

  async calculateCreditScore(creatorId: string): Promise<number> {
    const completedLoans = await db
      .select()
      .from(activeLoans)
      .where(and(
        eq(activeLoans.creatorId, creatorId),
        eq(activeLoans.status, 'paid_off')
      ));

    const activeLoansCount = await db
      .select()
      .from(activeLoans)
      .where(and(
        eq(activeLoans.creatorId, creatorId),
        eq(activeLoans.status, 'active')
      ));

    const defaultedLoans = await db
      .select()
      .from(activeLoans)
      .where(and(
        eq(activeLoans.creatorId, creatorId),
        eq(activeLoans.status, 'defaulted')
      ));

    let score = 500;

    score += completedLoans.length * 50;
    score -= defaultedLoans.length * 150;
    score -= activeLoansCount.length * 20;

    for (const loan of activeLoansCount) {
      if ((loan.latePaymentCount || 0) > 0) {
        score -= (loan.latePaymentCount || 0) * 10;
      }
    }

    return Math.min(Math.max(score, 300), 850);
  }

  private calculateRiskLevel(creditScore: number): 'low' | 'medium' | 'high' | 'very_high' {
    if (creditScore >= 700) return 'low';
    if (creditScore >= 600) return 'medium';
    if (creditScore >= 500) return 'high';
    return 'very_high';
  }

  private calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return principal / months;
    
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                   (Math.pow(1 + monthlyRate, months) - 1);
    
    return Math.round(payment * 100) / 100;
  }

  async getLoanAnalytics(userId: string, userType: 'creator' | 'lender') {
    const loans = userType === 'creator' 
      ? await this.getCreatorLoans(userId)
      : await this.getLenderLoans(userId);

    const totalLoans = loans.length;
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const paidOffLoans = loans.filter(l => l.status === 'paid_off').length;
    const defaultedLoans = loans.filter(l => l.status === 'defaulted').length;

    const totalBorrowed = loans.reduce((sum, l) => 
      sum + parseFloat(l.principalAmount.toString()), 0
    );

    const totalRepaid = loans.reduce((sum, l) => 
      sum + parseFloat((l.amountPaid || '0').toString()), 0
    );

    const totalOutstanding = loans
      .filter(l => l.status === 'active')
      .reduce((sum, l) => sum + parseFloat(l.remainingBalance.toString()), 0);

    return {
      totalLoans,
      activeLoans,
      paidOffLoans,
      defaultedLoans,
      totalBorrowed,
      totalRepaid,
      totalOutstanding,
      creditScore: userType === 'creator' ? await this.calculateCreditScore(userId) : null,
    };
  }
}

export const microlendingService = new MicrolendingService();
