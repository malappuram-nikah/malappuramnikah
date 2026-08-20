import { envConfig, EnvironmentConfig } from "../config/env.config";
import { logger, ILogger } from "../logging/logger.service";
import { ICacheService } from "../cache/ICacheService";
import { ICacheRepository } from "../cache/ICacheRepository";
import { MemoryCacheService } from "../../infrastructure/cache/MemoryCacheService";
import { IStorageService } from "../storage/IStorageService";
import { IStorageRepository } from "../storage/IStorageRepository";
import { MediaStorageAdapter } from "../../infrastructure/storage/MediaStorageAdapter";
import { IPasswordHasher } from "../security/IPasswordHasher";
import { BcryptPasswordHasher } from "../../infrastructure/security/BcryptPasswordHasher";
import { ITokenProvider } from "../security/ITokenProvider";
import { ITokenService } from "../security/ITokenService";
import { JwtTokenProvider } from "../../infrastructure/security/JwtTokenProvider";
import { IEncryptionService } from "../security/IEncryptionService";
import { CryptoEncryptionService } from "../../infrastructure/security/CryptoEncryptionService";
import { IEmailService } from "../email/IEmailService";
import { NodemailerEmailService } from "../../infrastructure/email/NodemailerEmailService";
import { ISmsService } from "../sms/ISmsService";
import { Msg91SmsService } from "../../infrastructure/sms/Msg91SmsService";
import { ITransactionHandler } from "../database/ITransactionHandler";
import { prisma, runInTransaction } from "../../infrastructure/database/prisma.service";

class DependencyContainer {
  public readonly config: EnvironmentConfig = envConfig;
  public readonly logger: ILogger = logger;
  public readonly db = prisma;

  // Cache
  public readonly cache: ICacheService = new MemoryCacheService();
  public readonly cacheRepository: ICacheRepository = this.cache;

  // Storage
  public readonly storage: IStorageService = new MediaStorageAdapter();
  public readonly storageRepository: IStorageRepository = this.storage;

  // Security
  public readonly passwordHasher: IPasswordHasher = new BcryptPasswordHasher();
  public readonly tokenProvider: ITokenProvider = new JwtTokenProvider();
  public readonly tokenService: ITokenService = this.tokenProvider;
  public readonly encryptionService: IEncryptionService = new CryptoEncryptionService();

  // Communication
  public readonly emailService: IEmailService = new NodemailerEmailService();
  public readonly smsService: ISmsService = new Msg91SmsService();

  // Database Transactions
  public readonly transactionHandler: ITransactionHandler = {
    runInTransaction: (fn: any) => runInTransaction(fn),
  };
}

export const container = new DependencyContainer();
