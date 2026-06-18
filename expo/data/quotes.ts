import { PathType } from "@/types";

export interface Quote {
  text: string;
  author: string;
  paths?: PathType[];
}

const generalQuotes: Quote[] = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Great things never come from comfort zones.", author: "Anonymous" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Anonymous" },
  { text: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.", author: "Roy T. Bennett" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
];

const introvertQuotes: Quote[] = [
  { text: "Your vibe attracts your tribe. Be authentically you.", author: "Anonymous", paths: ["introvert"] },
  { text: "The quieter you become, the more you can hear.", author: "Ram Dass", paths: ["introvert"] },
  { text: "Connection is why we're here. It gives purpose and meaning to our lives.", author: "Brené Brown", paths: ["introvert"] },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", paths: ["introvert"] },
  { text: "Friendship is born at that moment when one person says to another, 'What! You too?'", author: "C.S. Lewis", paths: ["introvert"] },
  { text: "The most basic human desire is to feel like you belong.", author: "Simon Sinek", paths: ["introvert"] },
  { text: "Social skills are like any other skill—the more you practice, the better you get.", author: "Daniel Wendler", paths: ["introvert"] },
  { text: "You don't have to be an extrovert to be good with people.", author: "Susan Cain", paths: ["introvert"] },
  { text: "The best conversations happen when you're genuinely curious about the other person.", author: "Anonymous", paths: ["introvert"] },
  { text: "Small talk is the appetizer for the feast of a deeper connection.", author: "Debra Fine", paths: ["introvert"] },
  { text: "Quality of relationships matters more than quantity.", author: "Anonymous", paths: ["introvert"] },
  { text: "Your comfort zone is where dreams go to die. Step outside.", author: "Anonymous", paths: ["introvert"] },
  { text: "Every expert was once a beginner at conversations.", author: "Anonymous", paths: ["introvert"] },
  { text: "Vulnerability is the birthplace of connection.", author: "Brené Brown", paths: ["introvert"] },
  { text: "You're not shy, you're just thoughtful about who you let in.", author: "Anonymous", paths: ["introvert"] },
];

const speakingQuotes: Quote[] = [
  { text: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt", paths: ["speaking"] },
  { text: "The art of communication is the language of leadership.", author: "James Humes", paths: ["speaking"] },
  { text: "Your voice is your superpower. Use it wisely, use it often.", author: "Anonymous", paths: ["speaking"] },
  { text: "The best speakers know that it's not about them—it's about the audience.", author: "Anonymous", paths: ["speaking"] },
  { text: "Stage fright is the body's way of telling you that you care.", author: "Anonymous", paths: ["speaking"] },
  { text: "Nervousness is just excitement that forgot to breathe.", author: "Anonymous", paths: ["speaking"] },
  { text: "Great speakers are made, not born. Practice creates confidence.", author: "Anonymous", paths: ["speaking"] },
  { text: "Be sincere; be brief; be seated.", author: "Franklin D. Roosevelt", paths: ["speaking"] },
  { text: "If you can't explain it simply, you don't understand it well enough.", author: "Albert Einstein", paths: ["speaking"] },
  { text: "Words are singularly the most powerful force available to humanity.", author: "Yehuda Berg", paths: ["speaking"] },
  { text: "There are always three speeches for every one you actually gave.", author: "Dale Carnegie", paths: ["speaking"] },
  { text: "The power of pause is often underestimated.", author: "Anonymous", paths: ["speaking"] },
  { text: "Your story is what you have, what you will always have. It is something to own.", author: "Michelle Obama", paths: ["speaking"] },
];

const assertivenessQuotes: Quote[] = [
  { text: "No is a complete sentence.", author: "Anne Lamott", paths: ["assertiveness"] },
  { text: "Stand up for what you believe in, even if it means standing alone.", author: "Anonymous", paths: ["assertiveness"] },
  { text: "Assertiveness is not what you do, it's who you are.", author: "Shakti Gawain", paths: ["assertiveness"] },
  { text: "Your boundaries are your responsibility.", author: "Anonymous", paths: ["assertiveness"] },
  { text: "Speak your mind even if your voice shakes.", author: "Maggie Kuhn", paths: ["assertiveness"] },
  { text: "The most common way people give up their power is by thinking they don't have any.", author: "Alice Walker", paths: ["assertiveness"] },
  { text: "Don't be afraid to say no to what you don't want, so you can say yes to what you do.", author: "Anonymous", paths: ["assertiveness"] },
  { text: "Boundaries aren't walls; they're respect.", author: "Anonymous", paths: ["assertiveness"] },
  { text: "You teach people how to treat you by what you allow.", author: "Anonymous", paths: ["assertiveness"] },
  { text: "Disagree without being disagreeable.", author: "Anonymous", paths: ["assertiveness"] },
  { text: "Your voice matters. Use it.", author: "Anonymous", paths: ["assertiveness"] },
  { text: "Self-respect is the cornerstone of all virtue.", author: "John Herschel", paths: ["assertiveness"] },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson", paths: ["assertiveness"] },
  { text: "Empower yourself by saying what you mean.", author: "Anonymous", paths: ["assertiveness"] },
];

export const QUOTES: Quote[] = [...generalQuotes, ...introvertQuotes, ...speakingQuotes, ...assertivenessQuotes];

export const getQuotesForPath = (path: PathType): Quote[] =>
  QUOTES.filter((q) => !q.paths || q.paths.includes(path));

export const getDailyQuote = (path?: PathType | null): Quote => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (path) {
    const pathQuotes = getQuotesForPath(path);
    return pathQuotes[dayOfYear % pathQuotes.length];
  }
  return QUOTES[dayOfYear % QUOTES.length];
};
