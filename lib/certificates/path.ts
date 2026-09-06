export function certificatePath(enrollmentId: string): string {
  return `/api/certificates/${enrollmentId}`;
}
