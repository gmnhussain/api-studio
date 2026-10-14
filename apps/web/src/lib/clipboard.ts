/**
 * Copies text to the clipboard.
 *
 * @returns Whether it was copied; browsers refuse without permission or a secure context.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
