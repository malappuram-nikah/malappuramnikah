import { envConfig, EnvironmentConfig } from "../config/env.config";
import { logger, ILogger } from "../logging/logger.service";
import { ICacheService } from "../cache/ICacheService";
import { MemoryCacheService } from "../../infrastructure/cache/MemoryCacheService";
import { IStorageService } from "../storage/IStorageService";
import { MediaStorageAdapter } from "../../infrastructure/storage/MediaStorageAdapter";
import { IPasswordHasher } from "../security/IPasswordHasher";
import { BcryptPasswordHasher } from "../../infrastructure/security/BcryptPasswordHasher";
import { ITokenProvider } from "../security/ITokenProvider";
import { JwtTokenProvider } from "../../infrastructure/security/JwtTokenProvider";
import { prisma } from "../../infrastructure/database/prisma.service";

class DependencyContainer {
  public readonly config: EnvironmentConfig = envConfig;
  public readonly logger: ILogger = logger;
  public readonly db = prisma;
  public readonly cache: ICacheService = new MemoryCacheService();
  public readonly storage: IStorageService = new MediaStorageAdapter();
  public readonly passwordHasher: IPasswordHasher = new BcryptPasswordHasher();
  public readonly tokenProvider: ITokenProvider = new JwtTokenProvider();
}

export const container = new DependencyContainer();
