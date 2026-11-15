export type Testimonial = {
  quote: string;
  name: string;
  /** Short role line, e.g. "CS student, beta user". */
  role: string;
};

/**
 * Real beta-user quotes only, used with the person's permission. The landing
 * page hides the testimonials section while this list is empty.
 */
export const TESTIMONIALS: readonly Testimonial[] = [];
