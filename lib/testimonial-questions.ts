import type { TestimonialCategory } from "./testimonials";

export interface TestimonialQuestion {
  id: string;
  text: string;
}

export const TESTIMONIAL_QUESTIONS: Record<
  TestimonialCategory,
  TestimonialQuestion[]
> = {
  trainer: [
    {
      id: "change",
      text: "What did you actually change or start doing after the session?",
    },
    {
      id: "convince",
      text: "If you had to convince a skeptical colleague to book Edmund, what would you say?",
    },
    {
      id: "surprise",
      text: "What surprised you most about how Edmund ran the training?",
    },
    {
      id: "before",
      text: "What was your biggest frustration or fear about AI at work before the session?",
    },
  ],
  mentor: [
    {
      id: "now-know",
      text: "What is one thing you now know or do because Edmund taught you?",
    },
    {
      id: "thinking",
      text: "How were you thinking about your work before mentoring, and how do you think about it now?",
    },
    {
      id: "moment",
      text: "Was there a specific mentoring moment that stuck with you?",
    },
  ],
  peer: [
    {
      id: "trust",
      text: "What is the one thing you would trust Edmund with that you would not trust most engineers with?",
    },
    {
      id: "describe",
      text: "How would you describe Edmund to someone hiring him for AI training?",
    },
    {
      id: "shipped",
      text: "What is something Edmund shipped or built alongside you that made a real difference?",
    },
  ],
  academic: [
    {
      id: "different",
      text: "What made Edmund different from other students in your class?",
    },
    {
      id: "produced",
      text: "Was there something Edmund produced or did that surprised you?",
    },
    {
      id: "recommend",
      text: "Would you recommend Edmund to a company hiring for AI engineering, and why?",
    },
  ],
  hackathon: [
    {
      id: "moment",
      text: "What was one moment during the hackathon where Edmund made a difference?",
    },
    {
      id: "approach",
      text: "How did Edmund approach the problem or the team differently from others?",
    },
    {
      id: "outcome",
      text: "What was the outcome of your team, and what did Edmund contribute to it?",
    },
  ],
  friend: [
    {
      id: "change-over-time",
      text: "How have you seen Edmund grow or change over time?",
    },
    {
      id: "strengths",
      text: "What is a strength of Edmund's that not many people know about?",
    },
    {
      id: "recommend-anyway",
      text: "Even as a friend, why would you recommend Edmund for AI training or building work?",
    },
  ],
};

export interface QuoteAnswer {
  question_id: string;
  question_text: string;
  answer: string;
}
