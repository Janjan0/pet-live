import type { PetId } from "./petTypes";

export type CommunityMember = {
  user: string;
  joinedAt: number;
  interactions: number;
  affection: number;
  care: number;
  play: number;
  gifts: number;
};

export type NubiCommunity = {
  petId: PetId;
  members: CommunityMember[];

  totalInteractions: number;
  totalAffection: number;
  totalCare: number;
  totalPlay: number;
  totalGifts: number;
};

export function createCommunity(
  petId: PetId,
): NubiCommunity {
  return {
    petId,
    members: [],

    totalInteractions: 0,
    totalAffection: 0,
    totalCare: 0,
    totalPlay: 0,
    totalGifts: 0,
  };
}

export function addCommunityInteraction(
  community: NubiCommunity,
  user: string,
  affection = 0,
  care = 0,
  play = 0,
  gift = false,
): NubiCommunity {
  const existing = community.members.find(
    (member) =>
      member.user.toLowerCase() ===
      user.toLowerCase(),
  );

  const nextTotals = {
    totalInteractions:
      community.totalInteractions + 1,

    totalAffection:
      community.totalAffection + affection,

    totalCare:
      community.totalCare + care,

    totalPlay:
      community.totalPlay + play,

    totalGifts:
      community.totalGifts + (gift ? 1 : 0),
  };

  if (!existing) {
    return {
      ...community,

      ...nextTotals,

      members: [
        ...community.members,
        {
          user,
          joinedAt: Date.now(),
          interactions: 1,
          affection,
          care,
          play,
          gifts: gift ? 1 : 0,
        },
      ],
    };
  }

  return {
    ...community,

    ...nextTotals,

    members: community.members.map(
      (member) =>
        member.user.toLowerCase() ===
        user.toLowerCase()
          ? {
              ...member,
              interactions:
                member.interactions + 1,
              affection:
                member.affection + affection,
              care:
                member.care + care,
              play:
                member.play + play,
              gifts:
                member.gifts +
                (gift ? 1 : 0),
            }
          : member,
    ),
  };
}
