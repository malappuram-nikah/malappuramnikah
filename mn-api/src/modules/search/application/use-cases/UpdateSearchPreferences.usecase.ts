import prisma from "../../../../shared/database/prisma";

export class UpdateSearchPreferencesUseCase {
  async execute(userId: number, preferences: any): Promise<any> {
    return await prisma.memberPreference.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...preferences },
      update: { ...preferences },
    });
  }
}
