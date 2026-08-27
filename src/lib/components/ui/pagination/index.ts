import Content from "./pagination-content.svelte";
import Ellipsis from "./pagination-ellipsis.svelte";
import Item from "./pagination-item.svelte";
import Link, { type PaginationLinkProps } from "./pagination-link.svelte";
import NextButton from "./pagination-next-button.svelte";
import Next from "./pagination-next.svelte";
import PrevButton from "./pagination-prev-button.svelte";
import Previous from "./pagination-previous.svelte";
import Status, { type PaginationStatusProps } from "./pagination-status.svelte";
import Root, {
	paginationIndicatorVariants,
	paginationVariants,
	type PaginationProps,
} from "./pagination.svelte";
import type { PaginationVariant } from "./pagination.svelte.js";

export {
	Root,
	Content,
	Item,
	Link,
	PrevButton, // old
	NextButton, // old
	Ellipsis,
	Previous,
	Next,
	Status,
	paginationVariants,
	paginationIndicatorVariants,
	type PaginationProps,
	type PaginationLinkProps,
	type PaginationStatusProps,
	type PaginationVariant,
	//
	Root as Pagination,
	Content as PaginationContent,
	Item as PaginationItem,
	Link as PaginationLink,
	PrevButton as PaginationPrevButton, // old
	NextButton as PaginationNextButton, // old
	Ellipsis as PaginationEllipsis,
	Previous as PaginationPrevious,
	Next as PaginationNext,
	Status as PaginationStatus,
};
