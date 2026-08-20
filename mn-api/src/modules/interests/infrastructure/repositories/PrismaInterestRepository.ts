import { IInterestRepository, GetInterestsOptions } from "../../domain/repositories/IInterestRepository";
import { InterestEntity } from "../../domain/entities/interest.entity";
import { prisma } from "../../../../infrastructure/database/prisma.service";

export class PrismaInterestRepository implements IInterestRepository {
  async findInterest(senderId: number, receiverId: number): Promise<InterestEntity | null> {
    const interest = await prisma.interest.findUnique({
      where: {
        sender_id_receiver_id: { sender_id: senderId, receiver_id: receiverId },
      },
    });
    return interest as unknown as InterestEntity;
  }

  async createInterest(senderId: number, receiverId: number): Promise<InterestEntity> {
    const created = await prisma.interest.create({
      data: {
        sender_id: senderId,
        receiver_id: receiverId,
        status: "PENDING",
      },
    });
    return created as unknown as InterestEntity;
  }

  async updateInterestStatus(id: number, status: string): Promise<InterestEntity> {
    const updated = await prisma.interest.update({
      where: { id },
      data: { status },
    });
    return updated as unknown as InterestEntity;
  }

  async deleteInterest(id: number): Promise<void> {
    await prisma.interest.delete({
      where: { id },
    });
  }

  async getUserForInterestCheck(userId: number) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        kyc_status: true,
        gender: true,
        first_name: true,
        last_name: true,
        location: true,
        profile_details: true,
      },
    });
  }

  async getUserInterests(userId: number, options: GetInterestsOptions) {
    const selectUserFields = {
      id: true,
      first_name: true,
      last_name: true,
      cast: true,
      location: true,
      gender: true,
      dob: true,
      profile_details: true,
    };

    if (options.type) {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      if (options.type === "sent") {
        const interests = await prisma.interest.findMany({
          where: { sender_id: userId, status: "PENDING" },
          include: { receiver: { select: selectUserFields } },
          skip,
          take: limit + 1,
          orderBy: { id: "desc" },
        });
        const hasMore = interests.length > limit;
        const users = interests.slice(0, limit).map((i) => ({ ...i.receiver, interest_status: i.status }));
        return { users, hasMore };
      } else if (options.type === "received") {
        const interests = await prisma.interest.findMany({
          where: { receiver_id: userId, status: "PENDING" },
          include: { sender: { select: selectUserFields } },
          skip,
          take: limit + 1,
          orderBy: { id: "desc" },
        });
        const hasMore = interests.length > limit;
        const users = interests.slice(0, limit).map((i) => ({ ...i.sender, interest_status: i.status }));
        return { users, hasMore };
      } else if (options.type === "mutual") {
        const interests = await prisma.interest.findMany({
          where: {
            OR: [
              { sender_id: userId, status: "ACCEPTED" },
              { receiver_id: userId, status: "ACCEPTED" },
            ],
          },
          include: {
            sender: { select: selectUserFields },
            receiver: { select: selectUserFields },
          },
          skip,
          take: limit + 1,
          orderBy: { id: "desc" },
        });
        const hasMore = interests.length > limit;
        const rawMutualUsers = interests.slice(0, limit).map((i) => {
          const peer = i.sender_id === userId ? i.receiver : i.sender;
          return { ...peer, interest_status: i.status };
        });
        const uniqueMutualUsers = Array.from(new Map(rawMutualUsers.map((u) => [u.id, u])).values());
        return { users: uniqueMutualUsers, hasMore };
      } else if (options.type === "viewed_me") {
        const views = await prisma.profileView.findMany({
          where: { viewed_id: userId },
          include: { viewer: { select: selectUserFields } },
          skip,
          take: limit + 1,
          orderBy: { created_at: "desc" },
        });
        const hasMore = views.length > limit;
        const rawUsers = views.slice(0, limit).map((v) => (v.viewer ? { ...v.viewer, viewed_at: v.created_at } : null)).filter(Boolean);
        const uniqueUsers = Array.from(new Map(rawUsers.map((u) => [u!.id, u])).values());
        return { users: uniqueUsers, hasMore };
      } else if (options.type === "visited") {
        const views = await prisma.profileView.findMany({
          where: { viewer_id: userId },
          include: { viewed: { select: selectUserFields } },
          skip,
          take: limit + 1,
          orderBy: { created_at: "desc" },
        });
        const hasMore = views.length > limit;
        const rawUsers = views.slice(0, limit).map((v) => (v.viewed ? { ...v.viewed, viewed_at: v.created_at } : null)).filter(Boolean);
        const uniqueUsers = Array.from(new Map(rawUsers.map((u) => [u!.id, u])).values());
        return { users: uniqueUsers, hasMore };
      }
    }

    if (options.idsOnly) {
      const allInterests = await prisma.interest.findMany({
        where: {
          OR: [{ sender_id: userId }, { receiver_id: userId }],
        },
        select: { sender_id: true, receiver_id: true, status: true },
      });

      const sent: { id: number }[] = [];
      const received: { id: number }[] = [];
      const mutual: { id: number }[] = [];

      allInterests.forEach((item) => {
        if (item.status === "ACCEPTED") {
          const peerId = item.sender_id === userId ? item.receiver_id : item.sender_id;
          mutual.push({ id: peerId });
        } else if (item.sender_id === userId) {
          sent.push({ id: item.receiver_id });
        } else if (item.receiver_id === userId) {
          received.push({ id: item.sender_id });
        }
      });

      const uniqueSent = Array.from(new Map(sent.map((m) => [m.id, m])).values());
      const uniqueReceived = Array.from(new Map(received.map((m) => [m.id, m])).values());
      const uniqueMutual = Array.from(new Map(mutual.map((m) => [m.id, m])).values());

      const viewsSentCount = await prisma.profileView.count({ where: { viewer_id: userId } });
      const viewsReceivedCount = await prisma.profileView.count({ where: { viewed_id: userId } });

      return {
        sent: uniqueSent,
        received: uniqueReceived,
        mutual: uniqueMutual,
        views_sent_count: viewsSentCount,
        views_received_count: viewsReceivedCount,
      };
    }

    const [sentInterests, receivedInterests, mutualMatches] = await Promise.all([
      prisma.interest.findMany({
        where: { sender_id: userId },
        include: { receiver: { select: selectUserFields } },
      }),
      prisma.interest.findMany({
        where: { receiver_id: userId },
        include: { sender: { select: selectUserFields } },
      }),
      prisma.interest.findMany({
        where: {
          OR: [
            { sender_id: userId, status: "ACCEPTED" },
            { receiver_id: userId, status: "ACCEPTED" },
          ],
        },
        include: {
          sender: { select: selectUserFields },
          receiver: { select: selectUserFields },
        },
      }),
    ]);

    const sentMap = new Map<number, any>();
    sentInterests.forEach((i) => {
      if (i.receiver) sentMap.set(i.receiver.id, { ...i.receiver, interest_status: i.status });
    });

    const receivedMap = new Map<number, any>();
    receivedInterests.forEach((i) => {
      if (i.sender) receivedMap.set(i.sender.id, { ...i.sender, interest_status: i.status });
    });

    const mutualMap = new Map<number, any>();
    mutualMatches.forEach((match) => {
      const peer = match.sender_id === userId ? match.receiver : match.sender;
      if (peer) mutualMap.set(peer.id, { ...peer, interest_status: match.status });
    });

    return {
      sent: Array.from(sentMap.values()),
      received: Array.from(receivedMap.values()),
      mutual: Array.from(mutualMap.values()),
    };
  }
}
