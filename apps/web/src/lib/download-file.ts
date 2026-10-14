/**
 * How long an object URL outlives the click that downloads it. Browsers start the download
 * from the URL asynchronously; revoking it at once can cancel the download in some of them.
 */
const OBJECT_URL_LIFETIME_MILLISECONDS = 1000;

/** Saves bytes as a file through the browser's download, without leaving the page. */
export function downloadFile(content: Blob, fileName: string): void {
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, OBJECT_URL_LIFETIME_MILLISECONDS);
}
