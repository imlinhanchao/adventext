import { withInstall } from '@/utils';
import codeEditor from './src/CodeEditor.vue';
import jsonPreview from './src/json-preview/JsonPreview.vue';
import objectTree from './src/objectTree/ObjectTree.vue';

export const JsonPreview = withInstall(jsonPreview);
export const CodeEditor = withInstall(codeEditor);
export const ObjectTree = withInstall(objectTree);

export * from './src/typing';
export default CodeEditor;