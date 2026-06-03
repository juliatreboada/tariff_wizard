const MAX_CLUB_LOGO_BYTES = 500 * 1024;

export function readClubLogoFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("invalid-type"));
  }
  if (file.size > MAX_CLUB_LOGO_BYTES) {
    return Promise.reject(new Error("too-large"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("read-failed"));
      }
    };
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}
