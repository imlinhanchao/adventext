import { Item } from "@/api/item";
import { Scene } from "@/api/scene";
import { Draft } from "@/api/draft";
import { Story } from "@/api/story";
import { Target } from "@/api/target";

export const StoryContext = Symbol('ItemsContext') as InjectionKey<Ref<Story | Draft>>;
export const ItemsContext = Symbol('ItemsContext') as InjectionKey<Ref<Item[]>>;
export const TargetsContext = Symbol('TargetsContext') as InjectionKey<Ref<Target[]>>;
export const ScenesContext = Symbol('ItemsContext') as InjectionKey<Ref<Scene[]>>;

export function contentFormat({ content }: { content: any }) {
  if (typeof content === 'object') {
    return JSON.stringify(content);
  }
  return content;
}