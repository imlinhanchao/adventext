import { Item } from "@/api/item";
import { Scene } from "@/api/scene";
import { Story } from "@/api/story";

export const StoryContext = Symbol('ItemsContext') as InjectionKey<Ref<Story>>;
export const ItemsContext = Symbol('ItemsContext') as InjectionKey<Ref<Item[]>>;
export const ScenesContext = Symbol('ItemsContext') as InjectionKey<Ref<Scene[]>>;