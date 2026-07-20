import {
  Heart,
  Target,
  RefreshCw,
  UserPlus,
  Search,
  Mountain,
  Compass,
  Rocket,
  Sprout,
  BookOpen,
  Sun,
  Shield,
  Anchor,
  Grid3x3,
  Sparkles,
  Link as LinkIcon,
  Eye,
  Scale,
  ShieldCheck,
  Smile,
  Hammer,
  Zap,
  Code,
  Cog,
  MapPin,
  Feather,
  Users,
  Puzzle,
  Wrench,
  Lightbulb,
  Flag,
  ClipboardCheck,
  ShieldPlus,
  Network,
  ArrowRight,
  Sunrise,
  Palette,
  Boxes,
  Clock,
  Presentation,
  MessageSquare,
  Star,
  Brain,
  Gem,
  Handshake,
  type LucideIcon,
} from "lucide-react";

// Icon + short-prose description per keyword. Each card on /testimonials shows:
// [icon] KEYWORD ×count · <description>. New keywords: add here or fall back
// to DEFAULT_META (star icon + auto-humanised label).
export interface KeywordMeta {
  Icon: LucideIcon;
  description: string;
}

export const KEYWORD_META: Record<string, KeywordMeta> = {
  // Character
  generous: { Icon: Heart, description: "Gives away time, tools, and know-how freely" },
  focused: { Icon: Target, description: "Doesn't wander from the goal" },
  curious: { Icon: Search, description: "Digs until he understands the root" },
  perseverance: { Icon: Mountain, description: "Never try, never know; never give up" },
  hardworking: { Icon: Hammer, description: "Puts in the effort the goal actually needs" },
  kind: { Icon: Heart, description: "Genuinely wants people around him to win" },
  reliable: { Icon: ShieldCheck, description: "You can count on the follow-through" },
  authentic: { Icon: Feather, description: "Real, unrehearsed, honest in the room" },
  dependable: { Icon: ShieldCheck, description: "Shows up, closes the loop" },
  responsible: { Icon: ClipboardCheck, description: "Takes ownership of the work" },
  positive: { Icon: Sun, description: "Uplifting energy in every room he enters" },
  energetic: { Icon: Zap, description: "Bring-the-fuel type of collaborator" },
  uplifting: { Icon: Sunrise, description: "Makes you believe you can do more" },
  courage: { Icon: Shield, description: "Steps into what most people avoid" },
  "self-driven": { Icon: Rocket, description: "No need to be told twice" },
  resilient: { Icon: Anchor, description: "Steady when the ground shakes" },
  composure: { Icon: Feather, description: "Calm under pressure, not reactive" },
  perceptive: { Icon: Eye, description: "Notices what most people miss" },
  objective: { Icon: Scale, description: "Facts over feelings when it matters" },
  methodical: { Icon: Grid3x3, description: "Breaks down chaos into steps" },
  practical: { Icon: Wrench, description: "Applies theory to what actually ships" },
  "deep-thinker": { Icon: Brain, description: "Sits with a problem until it yields" },
  "quality-focused": { Icon: Gem, description: "'Good enough' isn't in the vocabulary" },
  "attention-to-detail": { Icon: Search, description: "The 1% details others skip" },
  craftsmanship: { Icon: Hammer, description: "Finishing a task isn't doing it well" },
  "high-standards": { Icon: Star, description: "Sets the bar, then raises it" },
  "work-ethic": { Icon: Hammer, description: "Consistent effort, no shortcuts" },

  // Capability
  mentor: { Icon: UserPlus, description: "Pulls people up as he climbs" },
  guiding: { Icon: Compass, description: "Points at the next right step" },
  teaches: { Icon: Presentation, description: "Turns complex ideas into shared understanding" },
  "explains-well": { Icon: Presentation, description: "Uses analogies that actually land" },
  engaging: { Icon: Sparkles, description: "Nobody drifts in his sessions" },
  inspiring: { Icon: Sparkles, description: "Leaves people wanting to try" },
  inquisitive: { Icon: Search, description: "Asks the question everyone else missed" },
  communicator: { Icon: MessageSquare, description: "Says the thing clearly, first try" },
  networking: { Icon: Network, description: "Turns strangers into genuine connections" },
  ideas: { Icon: Lightbulb, description: "Plenty of them, ready to try" },
  researcher: { Icon: BookOpen, description: "Goes to the source, not the summary" },
  strategic: { Icon: Compass, description: "Sees the game before the move" },
  planning: { Icon: MapPin, description: "Maps the work before touching it" },
  decisive: { Icon: ArrowRight, description: "Calls it and moves" },
  leader: { Icon: Flag, description: "People follow because they want to" },
  leadership: { Icon: Flag, description: "Direction, calm, and momentum in one" },
  "team-player": { Icon: Users, description: "Makes the whole team better" },
  builds: { Icon: Boxes, description: "Ships real products, not just ideas" },
  technical: { Icon: Code, description: "The deep stack, from bottom to top" },
  innovative: { Icon: Lightbulb, description: "Finds an angle nobody else tried" },
  creative: { Icon: Palette, description: "Solves problems the elegant way" },
  "up-to-date": { Icon: Clock, description: "Current on tools, models, and shifts" },
  "bridges-tech-business": { Icon: LinkIcon, description: "Translates engineering into outcome" },

  // Impact (what he causes in others)
  "mindset-shift": { Icon: RefreshCw, description: "You leave thinking differently" },
  clarity: { Icon: Sun, description: "The fog lifts after talking to him" },
  intentional: { Icon: Target, description: "Deliberate about time and energy" },
  "action-oriented": { Icon: Rocket, description: "Idea → move, no long detour" },
  "growth-mindset": { Icon: Sprout, description: "Sees every setback as data" },
  learning: { Icon: BookOpen, description: "1% every day, always" },
  purpose: { Icon: Compass, description: "Helps you find your own why" },
  "self-reflection": { Icon: Eye, description: "The mirror you didn't know you needed" },
  "decision-making": { Icon: Scale, description: "Cleaner choices, less second-guessing" },
  "confidence-building": { Icon: ShieldPlus, description: "You believe more after working with him" },
  impact: { Icon: Sparkles, description: "The change sticks long after the session" },
  strengths: { Icon: Star, description: "Helps you see what you already have" },
};

const DEFAULT_META: KeywordMeta = {
  Icon: Star,
  description: "One of the words people use about Edmund",
};

export function getKeywordMeta(keyword: string): KeywordMeta {
  return KEYWORD_META[keyword] ?? DEFAULT_META;
}

// Title-case for display: "mindset-shift" → "Mindset Shift", "self-driven" → "Self Driven".
export function keywordLabel(keyword: string): string {
  return keyword
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// One-off unused-import guard for future icons we've imported but not yet
// wired into KEYWORD_META. Prevents dead imports from being flagged by eslint.
const _RESERVED: unknown = { Cog, Handshake, Smile, Puzzle };
void _RESERVED;
