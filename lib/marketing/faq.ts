export type FaqEntry = { question: string; answer: string };

/**
 * Rendered on the landing page and emitted as FAQPage JSON-LD from the same
 * list, so the structured data never drifts from the visible answers.
 * Keep each answer true to the product: answer engines quote these verbatim.
 */
export const LANDING_FAQ: readonly FaqEntry[] = [
  {
    question: "What is CertiTube?",
    answer:
      "CertiTube is a free platform that turns any YouTube video or playlist into a trackable personal course. It credits your watch time, builds a daily learning streak with a consistency heatmap, lets you take notes, and gives you a public profile that shows what you've learned.",
  },
  {
    question: "Is CertiTube free?",
    answer: "Yes, CertiTube is completely free to use.",
  },
  {
    question: "How does CertiTube track my progress?",
    answer:
      "As you watch a video through CertiTube, it records the percentage of the video you've actually watched and resumes at your exact last position. A lesson is marked completed once you reach 75% credited watch time.",
  },
  {
    question: "Does CertiTube work with YouTube playlists?",
    answer:
      "Yes. Paste any public YouTube playlist URL and CertiTube turns it into a multi-lesson course, with one lesson per video and progress tracked per lesson. Playlists can have up to 200 videos and should be lectures, tutorials, or other educational content.",
  },
  {
    question: "What is a CertiTube public profile?",
    answer:
      "Your public profile (at certitube.vercel.app/u/your-username) shows your learning stats, daily consistency heatmap, and completed courses. You choose what appears, and you can share the link with recruiters as proof of self-learning.",
  },
  {
    question: "What is the CertiTube streak and heatmap?",
    answer:
      "Every day you open CertiTube while signed in counts as a daily check-in and grows your streak. A GitHub-style heatmap of your credited watch time shows your learning consistency over the past year on both your dashboard and your public profile.",
  },
  {
    question: "Can I take notes while watching?",
    answer:
      "Yes. Each lesson has a rich-text notes editor (headings, bold, italic) and can sync your notes to Notion.",
  },
];
