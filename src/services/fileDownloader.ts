import { getApiBaseUrl } from './api';

/**
 * Convert base64 data string to Blob
 */
export function base64ToBlob(base64Data: string, contentType = 'application/pdf'): Blob {
  // Remove data URI prefix if present
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const byteCharacters = atob(cleanBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

/**
 * Trigger browser file download from a Blob
 */
export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }, 3000);
}

/**
 * Universal downloader for remote PDF / attachments (Receipts, Invoices, Delivery slips, etc.)
 * Works reliably on iOS Safari, Android Chrome, PWA, and desktop.
 */
export async function downloadFileFromUrl(pathOrUrl: string, defaultFileName = 'document.pdf'): Promise<void> {
  const baseUrl = getApiBaseUrl();
  let fullUrl = pathOrUrl;
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://') && !fullUrl.startsWith('data:') && !fullUrl.startsWith('blob:')) {
    fullUrl = `${baseUrl}${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}`;
  }

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    // Try to get filename from Content-Disposition header
    let fileName = defaultFileName;
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        fileName = decodeURIComponent(match[1].replace(/['"]/g, ''));
      }
    }

    const contentType = response.headers.get('Content-Type') || 'application/pdf';
    const blob = await response.blob();
    const finalBlob = new Blob([blob], { type: contentType });
    triggerBlobDownload(finalBlob, fileName);
  } catch (error) {
    console.warn('Direct blob download failed, falling back to direct link/window.open:', error);
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = defaultFileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 2000);
  }
}

/**
 * Universal downloader for Base64 attachments
 */
export function downloadBase64File(base64Data: string, fileName = 'document.pdf', mimeType = 'application/pdf'): void {
  if (!base64Data) return;
  try {
    const blob = base64ToBlob(base64Data, mimeType);
    triggerBlobDownload(blob, fileName);
  } catch (e) {
    console.error('downloadBase64File error:', e);
    // Fallback to data URI
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64Data}`;
    link.download = fileName;
    link.click();
  }
}

/**
 * Open PDF or document in new tab
 */
export function openFileFromUrl(pathOrUrl: string): void {
  const baseUrl = getApiBaseUrl();
  let fullUrl = pathOrUrl;
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://') && !fullUrl.startsWith('data:') && !fullUrl.startsWith('blob:')) {
    fullUrl = `${baseUrl}${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}`;
  }
  window.open(fullUrl, '_blank');
}
