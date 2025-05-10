import { defHttp } from '@/utils/http';
import { Draft } from './draft';


export class Story extends Draft {
  /**
   * 来源故事ID
   */
  sourceId: number;

  /**
   * 故事状态
   */
  status: number;
  
  constructor() {
    super()
    this.sourceId = 0;
    this.status = 0;
  }
}

export function getStoryList() {
  return defHttp.get<Story[]>({
    url: '/story/list',
  });
}

export function getStory(id: string) {
  return defHttp.get<Story>({
    url: `/story/${id}`,
  });
}

export function createStory(story: Story) {
  return defHttp.post<Story>({
    url: '/story',
    data: story,
  });
}

export function updateStory(story: Story) {
  return defHttp.put<Story>({
    url: `/story/${story.id}`,
    data: story,
  });
}

export function deleteStory(id: string) {
  return defHttp.delete({
    url: `/story/${id}`,
  });
}

