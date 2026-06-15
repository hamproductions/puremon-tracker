import { domToBlob } from 'modern-screenshot';
import { saveAs } from 'file-saver';

export const xShareUrl = (text: string, url?: string) => {
  const params = new URLSearchParams({ text });
  if (url) params.set('url', url);
  return `https://x.com/intent/post?${params.toString()}`;
};

export const copyTextToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

export const downloadElementAsImage = async (
  element: HTMLElement,
  filename: string,
  backgroundColor?: string
) => {
  const blob = await domToBlob(element, {
    scale: 2,
    width: element.scrollWidth,
    height: element.scrollHeight,
    backgroundColor: backgroundColor ?? getComputedStyle(document.body).backgroundColor,
    style: { overflow: 'visible' }
  });
  if (blob) saveAs(blob, filename);
};
