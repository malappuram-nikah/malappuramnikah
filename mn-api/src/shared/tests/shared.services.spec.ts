import { container } from "../container/container";
import { ValidationError, NotFoundError, UnauthorizedError } from "../errors/AppError";
import { buildPaginatedResult } from "../utils/pagination.util";

describe("Shared Cross-Cutting Infrastructure Services", () => {
  describe("Configuration & Environment", () => {
    it("should load environment configuration successfully", () => {
      expect(container.config).toBeDefined();
      expect(container.config.port).toBeDefined();
      expect(container.config.jwt.secret).toBeDefined();
    });
  });

  describe("API Error Taxonomy", () => {
    it("should correctly assign status codes and error codes", () => {
      const valErr = new ValidationError("Invalid payload", [{ field: "email" }]);
      expect(valErr.statusCode).toBe(422);
      expect(valErr.code).toBe("VALIDATION_ERROR");

      const notFoundErr = new NotFoundError("User not found");
      expect(notFoundErr.statusCode).toBe(404);
      expect(notFoundErr.code).toBe("NOT_FOUND");

      const authErr = new UnauthorizedError("Unauthorized access");
      expect(authErr.statusCode).toBe(401);
      expect(authErr.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("Cache Repository (MemoryCacheService)", () => {
    it("should set, get, delete, and clear cache values", async () => {
      await container.cacheRepository.set("test_key", { user: "john" }, 60);
      const cached = await container.cacheRepository.get("test_key");
      expect(cached).toEqual({ user: "john" });

      await container.cacheRepository.delete("test_key");
      const deleted = await container.cacheRepository.get("test_key");
      expect(deleted).toBeNull();
    });
  });

  describe("Storage Repository", () => {
    it("should generate private media URLs", () => {
      const url = container.storageRepository.getPrivateUrl("test_doc.jpg");
      expect(url).toBeDefined();
      expect(url).toContain("test_doc");
    });
  });

  describe("Password Hasher & Token Service", () => {
    it("should hash and verify passwords cleanly", async () => {
      const hash = await container.passwordHasher.hash("Secret123!");
      expect(hash).not.toBe("Secret123!");
      const match = await container.passwordHasher.compare("Secret123!", hash);
      expect(match).toBe(true);
    });

    it("should generate and verify JWT tokens", () => {
      const token = container.tokenService.generateToken({ userId: 99, role: "USER" }, "1h");
      expect(token).toBeDefined();
      const payload = container.tokenService.verifyToken(token);
      expect(payload.userId).toBe(99);
    });
  });

  describe("Crypto Encryption Service", () => {
    it("should encrypt and decrypt strings symmetrically", () => {
      const plain = "Sensitive-SSN-12345";
      const cipherText = container.encryptionService.encrypt(plain);
      expect(cipherText).not.toBe(plain);
      const decrypted = container.encryptionService.decrypt(cipherText);
      expect(decrypted).toBe(plain);
    });
  });

  describe("Pagination & API Responses", () => {
    it("should build structured paginated responses", () => {
      const result = buildPaginatedResult(["item1", "item2"], 20, 1, 10);
      expect(result.data.length).toBe(2);
      expect(result.pagination.total).toBe(20);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
    });
  });
});
