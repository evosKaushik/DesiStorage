import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShimmerImage } from "@/components/ShimmerImage";
import useUserStore from "@/store/useUserStore";

/**
 * Owner avatar shown in the list-view "Owner" column. Files in a user's own
 * drive are always owned by the authenticated user, so we render their avatar.
 *
 * // Todo: Once the API returns per-file owner info, fetch and render the
 * // actual owner's avatar instead of the current user's.
 */
export const OwnerAvatar = () => {
  const user = useUserStore((state) => state.user);

  return (
    <Avatar
      className="h-7 w-7 overflow-hidden rounded-full border border-border/60"
      title={user?.fullName ?? undefined}
    >
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
        <ShimmerImage
          src={user?.avatar ?? "/default-avatar.png"}
          alt={user?.fullName ?? "Owner"}
          fill
          sizes=""
          className="object-cover"
        />
      </AvatarFallback>
    </Avatar>
  );
};

export default OwnerAvatar;