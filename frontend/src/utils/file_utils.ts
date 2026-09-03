export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${parseFloat((bytes / Math.pow(1024, index)).toFixed(2))} ${
    units[index]
  }`;
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export function getFileNameWithoutExtension(fileName: string): string {
  const extension = getFileExtension(fileName);

  if (!extension) {
    return fileName;
  }

  return fileName.slice(0, -(extension.length + 1));
}

export function isImageFile(fileName: string): boolean {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

  return imageExtensions.includes(getFileExtension(fileName));
}

export function isPdfFile(fileName: string): boolean {
  return getFileExtension(fileName) === "pdf";
}

export function isDocumentFile(fileName: string): boolean {
  const documentExtensions = ["doc", "docx", "txt", "rtf", "odt"];

  return documentExtensions.includes(getFileExtension(fileName));
}

export function isSpreadsheetFile(fileName: string): boolean {
  const spreadsheetExtensions = ["xls", "xlsx", "csv", "ods"];

  return spreadsheetExtensions.includes(getFileExtension(fileName));
}

export function isVideoFile(fileName: string): boolean {
  const videoExtensions = ["mp4", "webm", "mov", "avi", "mkv"];

  return videoExtensions.includes(getFileExtension(fileName));
}

export function isAudioFile(fileName: string): boolean {
  const audioExtensions = ["mp3", "wav", "ogg", "m4a", "aac"];

  return audioExtensions.includes(getFileExtension(fileName));
}