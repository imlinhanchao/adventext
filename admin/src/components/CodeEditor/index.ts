import { withInstall } from '@/utils';
import codeEditor from './src/CodeEditor.vue';
import jsonPreview from './src/json-preview/JsonPreview.vue';

export const JsonPreview = withInstall(jsonPreview);
export const CodeEditor = withInstall(codeEditor);

export * from './src/typing';
export default CodeEditor;