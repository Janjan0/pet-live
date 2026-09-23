import type { NubiCommunity } from "./community";
import { addCommunityInteraction } from "./community";
import type { PetId } from "./petTypes";

export type CommunityAssignment = {
  petId: PetId;
  community: NubiCommunity;
};

export function assignViewerToNubi(
  community: NubiCommunity,
  user: string,
): CommunityAssignment {
  return {
    petId: community.petId,

    community: addCommunityInteraction(
      community,
      user,
    ),
  };
}
