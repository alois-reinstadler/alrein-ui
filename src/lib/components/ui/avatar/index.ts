import Badge from "./avatar-badge.svelte";
import Fallback from "./avatar-fallback.svelte";
import GroupCount from "./avatar-group-count.svelte";
import Group, {
	avatarGroupVariants,
	type AvatarGroupItemProps,
	type AvatarGroupProps,
	type AvatarGroupVariants,
} from "./avatar-group.svelte";
import Image from "./avatar-image.svelte";
import Root, {
	avatarVariants,
	type AvatarPresence,
	type AvatarProps,
	type AvatarSize,
	type AvatarVariants,
} from "./avatar.svelte";

export {
	Root,
	Image,
	Fallback,
	Badge,
	Group,
	GroupCount,
	//
	Root as Avatar,
	Image as AvatarImage,
	Fallback as AvatarFallback,
	Badge as AvatarBadge,
	Group as AvatarGroup,
	GroupCount as AvatarGroupCount,
	//
	avatarVariants,
	avatarGroupVariants,
	type AvatarPresence,
	type AvatarProps,
	type AvatarSize,
	type AvatarVariants,
	type AvatarGroupItemProps,
	type AvatarGroupProps,
	type AvatarGroupVariants,
};
