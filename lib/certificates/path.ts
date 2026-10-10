export function certificatePath(enrollmentId: string): string {
  return `/api/certificates/${enrollmentId}`;
}

export function certificateVerifyPath(token: string): string {
  return `/verify/${token}`;
}

export function certificateVerifyUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}${certificateVerifyPath(token)}`;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
