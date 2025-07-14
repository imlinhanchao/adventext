import pako from 'pako';

export function unGzip(data: string): any {
  // 使用浏览器原生的 atob 来解码 base64
  const compressedString = atob(data);
  const compressed = new Uint8Array(compressedString.length);
  for (let i = 0; i < compressedString.length; i++) {
    compressed[i] = compressedString.charCodeAt(i);
  }
  
  // 使用 pako 解压缩
  const utf8Bytes = pako.inflate(compressed);
  
  // 使用 TextDecoder 将字节转换为字符串
  const decoder = new TextDecoder('utf-8');
  const jsonString = decoder.decode(utf8Bytes);
  
  return JSON.parse(jsonString);
}