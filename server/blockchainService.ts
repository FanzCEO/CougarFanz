import { db } from './db';
import { 
  nftCollections, 
  nfts, 
  nftOwnershipHistory, 
  nftRoyalties,
  type InsertNftCollection,
  type InsertNft,
  type InsertNftOwnershipHistory,
  type InsertNftRoyalty,
  type NftCollection,
  type Nft,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export class BlockchainService {
  async createCollection(creatorId: string, data: Omit<InsertNftCollection, 'creatorId'>): Promise<NftCollection> {
    const [collection] = await db.insert(nftCollections).values({
      ...data,
      creatorId,
    }).returning();
    
    return collection;
  }

  async getCollection(collectionId: string): Promise<NftCollection | undefined> {
    const [collection] = await db
      .select()
      .from(nftCollections)
      .where(eq(nftCollections.id, collectionId));
    
    return collection;
  }

  async getCreatorCollections(creatorId: string): Promise<NftCollection[]> {
    return await db
      .select()
      .from(nftCollections)
      .where(eq(nftCollections.creatorId, creatorId))
      .orderBy(desc(nftCollections.createdAt));
  }

  async mintNFT(data: Omit<InsertNft, 'tokenId'>, blockchain?: string): Promise<Nft> {
    const tokenId = `PF-${nanoid(16)}`;
    
    const collection = await this.getCollection(data.collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }
    
    const effectiveBlockchain = blockchain || collection.blockchain || 'polygon';
    
    const [nft] = await db.insert(nfts).values({
      ...data,
      tokenId,
    }).returning();

    await db.insert(nftOwnershipHistory).values({
      nftId: nft.id,
      fromOwner: null,
      toOwner: nft.currentOwner,
      transactionType: 'mint',
      price: nft.mintPrice,
      transactionHash: nft.transactionHash,
      blockchain: effectiveBlockchain,
    });

    await db
      .update(nftCollections)
      .set({ 
        totalSupply: sql`${nftCollections.totalSupply} + 1` 
      })
      .where(eq(nftCollections.id, nft.collectionId));

    return nft;
  }

  async getNFT(nftId: string): Promise<Nft | undefined> {
    const [nft] = await db
      .select()
      .from(nfts)
      .where(eq(nfts.id, nftId));
    
    return nft;
  }

  async getUserNFTs(userId: string): Promise<Nft[]> {
    return await db
      .select()
      .from(nfts)
      .where(eq(nfts.currentOwner, userId))
      .orderBy(desc(nfts.mintedAt));
  }

  async getCollectionNFTs(collectionId: string): Promise<Nft[]> {
    return await db
      .select()
      .from(nfts)
      .where(eq(nfts.collectionId, collectionId))
      .orderBy(desc(nfts.mintedAt));
  }

  async transferNFT(
    nftId: string,
    fromOwnerId: string,
    toOwnerId: string,
    transactionType: 'sale' | 'transfer' | 'gift',
    price?: string,
    transactionHash?: string,
    blockchain?: string
  ): Promise<void> {
    const nft = await this.getNFT(nftId);
    if (!nft) {
      throw new Error('NFT not found');
    }

    if (nft.currentOwner !== fromOwnerId) {
      throw new Error('Unauthorized: Not the current owner');
    }

    const collection = await this.getCollection(nft.collectionId);
    const effectiveBlockchain = blockchain || collection?.blockchain || 'polygon';

    await db
      .update(nfts)
      .set({ 
        currentOwner: toOwnerId,
        lastSalePrice: price || nft.lastSalePrice,
        isListed: false,
        updatedAt: new Date(),
      })
      .where(eq(nfts.id, nftId));

    const [ownershipRecord] = await db.insert(nftOwnershipHistory).values({
      nftId,
      fromOwner: fromOwnerId,
      toOwner: toOwnerId,
      transactionType,
      price,
      transactionHash,
      blockchain: effectiveBlockchain,
    }).returning();

    if (transactionType === 'sale' && price) {
      await this.processRoyalty(nft, ownershipRecord.id, price);
      await this.updateMarketplaceStats(nft.collectionId, price);
    }
  }

  async updateMarketplaceStats(collectionId: string, salePrice: string): Promise<void> {
    const collectionNfts = await this.getCollectionNFTs(collectionId);
    const listedNfts = collectionNfts.filter(n => n.isListed);
    
    const floorPrice = listedNfts.length > 0
      ? Math.min(...listedNfts.map(n => parseFloat(n.listPrice || '0')).filter(p => p > 0))
      : 0;

    await db
      .update(nftCollections)
      .set({
        floorPrice: floorPrice.toFixed(8),
        totalVolume: sql`${nftCollections.totalVolume} + ${parseFloat(salePrice)}`,
        updatedAt: new Date(),
      })
      .where(eq(nftCollections.id, collectionId));
  }

  async processRoyalty(nft: Nft, saleId: string, salePrice: string): Promise<void> {
    const collection = await this.getCollection(nft.collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    const royaltyPercentage = parseFloat(collection.royaltyPercentage || '0');
    if (royaltyPercentage === 0) {
      return;
    }

    const salePriceNum = parseFloat(salePrice);
    const royaltyAmount = (salePriceNum * royaltyPercentage / 100).toFixed(8);

    await db.insert(nftRoyalties).values({
      nftId: nft.id,
      collectionId: nft.collectionId,
      creatorId: collection.creatorId,
      saleId,
      salePrice,
      royaltyAmount,
      royaltyPercentage: collection.royaltyPercentage!,
      status: 'pending',
    });
  }

  async listNFT(nftId: string, ownerId: string, listPrice: string): Promise<void> {
    const nft = await this.getNFT(nftId);
    if (!nft) {
      throw new Error('NFT not found');
    }

    if (nft.currentOwner !== ownerId) {
      throw new Error('Unauthorized: Not the current owner');
    }

    await db
      .update(nfts)
      .set({ 
        isListed: true,
        listPrice,
        updatedAt: new Date(),
      })
      .where(eq(nfts.id, nftId));
  }

  async delistNFT(nftId: string, ownerId: string): Promise<void> {
    const nft = await this.getNFT(nftId);
    if (!nft) {
      throw new Error('NFT not found');
    }

    if (nft.currentOwner !== ownerId) {
      throw new Error('Unauthorized: Not the current owner');
    }

    await db
      .update(nfts)
      .set({ 
        isListed: false,
        listPrice: null,
        updatedAt: new Date(),
      })
      .where(eq(nfts.id, nftId));
  }

  async getMarketplaceListings(): Promise<Nft[]> {
    return await db
      .select()
      .from(nfts)
      .where(eq(nfts.isListed, true))
      .orderBy(desc(nfts.mintedAt));
  }

  async getRoyaltiesForCreator(creatorId: string) {
    return await db
      .select()
      .from(nftRoyalties)
      .where(eq(nftRoyalties.creatorId, creatorId))
      .orderBy(desc(nftRoyalties.createdAt));
  }

  async updateRoyaltyStatus(
    royaltyId: string,
    status: 'paid' | 'failed',
    transactionHash?: string
  ): Promise<void> {
    await db
      .update(nftRoyalties)
      .set({ 
        status,
        transactionHash,
        paidAt: status === 'paid' ? new Date() : undefined,
      })
      .where(eq(nftRoyalties.id, royaltyId));
  }

  async getOwnershipHistory(nftId: string) {
    return await db
      .select()
      .from(nftOwnershipHistory)
      .where(eq(nftOwnershipHistory.nftId, nftId))
      .orderBy(desc(nftOwnershipHistory.createdAt));
  }

  async generateMetadata(nft: Nft): Promise<object> {
    return {
      name: nft.name,
      description: nft.description,
      image: nft.tokenUri,
      attributes: nft.metadata,
      properties: {
        tokenId: nft.tokenId,
        rarity: nft.rarity,
        mintedBy: nft.mintedBy,
        mintedAt: nft.mintedAt,
      },
    };
  }
}

export const blockchainService = new BlockchainService();
