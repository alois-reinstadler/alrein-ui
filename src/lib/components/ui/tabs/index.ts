import Content from "./tabs-content.svelte";
import Trigger, { type TabsTriggerProps } from "./tabs-trigger.svelte";
import Root, { type TabsProps } from "./tabs.svelte";
import List, {
	tabsIndicatorVariants,
	tabsListVariants,
	type TabsListProps,
	type TabsListVariant,
} from "./tabs-list.svelte";

export {
	Root,
	Content,
	List,
	Trigger,
	tabsListVariants,
	tabsIndicatorVariants,
	type TabsListVariant,
	type TabsProps,
	type TabsListProps,
	type TabsTriggerProps,
	//
	Root as Tabs,
	Content as TabsContent,
	List as TabsList,
	Trigger as TabsTrigger,
};
