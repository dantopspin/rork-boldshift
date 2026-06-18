export interface BonusChallenge {
  id: string;
  title: string;
  description: string;
  xp: number;
  category: "social" | "mindset" | "action" | "reflection";
}

export const BONUS_CHALLENGES: BonusChallenge[] = [
  { id: "bc_1", title: "Compliment a stranger", description: "Give a genuine compliment to someone you don't know", xp: 5, category: "social" },
  { id: "bc_2", title: "Call instead of text", description: "Make a phone call instead of sending a text message", xp: 5, category: "social" },
  { id: "bc_3", title: "Start a conversation", description: "Strike up a conversation with someone in line or waiting", xp: 5, category: "social" },
  { id: "bc_4", title: "Ask for help", description: "Ask someone for directions or a recommendation", xp: 5, category: "social" },
  { id: "bc_5", title: "Give a recommendation", description: "Recommend a book, movie, or restaurant to someone", xp: 5, category: "social" },
  { id: "bc_6", title: "Reconnect", description: "Reach out to someone you haven't talked to in a while", xp: 5, category: "social" },
  { id: "bc_7", title: "Express gratitude", description: "Thank someone genuinely for something they did", xp: 5, category: "social" },
  { id: "bc_8", title: "Share a joke", description: "Tell a light-hearted joke to someone today", xp: 5, category: "social" },
  { id: "bc_9", title: "Introduce yourself", description: "Introduce yourself to a new person in your vicinity", xp: 5, category: "social" },
  { id: "bc_10", title: "Offer help", description: "Offer assistance to a stranger with something simple", xp: 5, category: "social" },
  { id: "bc_11", title: "Join a group chat", description: "Join an ongoing conversation with a small group", xp: 5, category: "social" },
  { id: "bc_12", title: "Send a message", description: "Send a thoughtful message to a friend or acquaintance", xp: 5, category: "social" },
  { id: "bc_13", title: "Attend an event", description: "Attend a brief social gathering or meetup", xp: 5, category: "social" },
  { id: "bc_14", title: "Compliment a friend", description: "Give a sincere compliment to a friend or colleague", xp: 5, category: "social" },
  { id: "bc_15", title: "Ask about their day", description: "Ask someone how their day is going and listen", xp: 5, category: "social" },
  { id: "bc_16", title: "Power pose", description: "Hold a confident pose for 2 minutes before an important moment", xp: 5, category: "mindset" },
  { id: "bc_17", title: "Positive affirmations", description: "Say 5 positive affirmations out loud to yourself", xp: 5, category: "mindset" },
  { id: "bc_18", title: "Visualize success", description: "Spend 5 minutes visualizing a successful social interaction", xp: 5, category: "mindset" },
  { id: "bc_19", title: "Challenge a fear", description: "Identify one social fear and take a small step to face it", xp: 5, category: "mindset" },
  { id: "bc_20", title: "Embrace discomfort", description: "Do something slightly outside your comfort zone today", xp: 5, category: "mindset" },
  { id: "bc_21", title: "Deep breathing", description: "Practice deep breathing for 5 minutes to calm nerves", xp: 5, category: "mindset" },
  { id: "bc_22", title: "Reframe negative thought", description: "Reframe one negative thought into a positive one", xp: 5, category: "mindset" },
  { id: "bc_23", title: "Set confidence goal", description: "Set a small daily goal to build your confidence", xp: 5, category: "mindset" },
  { id: "bc_24", title: "Read inspiring quote", description: "Read and reflect on an inspiring quote about courage", xp: 5, category: "mindset" },
  { id: "bc_25", title: "Meditate briefly", description: "Meditate for 5 minutes focusing on self-acceptance", xp: 5, category: "mindset" },
  { id: "bc_26", title: "List strengths", description: "List 5 personal strengths and why they matter", xp: 5, category: "mindset" },
  { id: "bc_27", title: "Imagine tough situation", description: "Visualize handling a challenging social scenario well", xp: 5, category: "mindset" },
  { id: "bc_28", title: "Forgive past mistake", description: "Forgive yourself for a past social awkwardness", xp: 5, category: "mindset" },
  { id: "bc_29", title: "Affirm your worth", description: "Repeat affirmations of your inherent worth", xp: 5, category: "mindset" },
  { id: "bc_30", title: "Challenge beliefs", description: "Challenge one limiting belief about social skills", xp: 5, category: "mindset" },
  { id: "bc_31", title: "Smile at everyone", description: "Smile at every person you make eye contact with today", xp: 5, category: "action" },
  { id: "bc_32", title: "Maintain eye contact", description: "Practice maintaining eye contact during conversations", xp: 5, category: "action" },
  { id: "bc_33", title: "Speak louder", description: "Consciously speak 20% louder than usual today", xp: 5, category: "action" },
  { id: "bc_34", title: "Stand tall", description: "Focus on your posture all day - shoulders back, chin up", xp: 5, category: "action" },
  { id: "bc_35", title: "First to greet", description: "Be the first to say hello in every interaction today", xp: 5, category: "action" },
  { id: "bc_36", title: "No phone check", description: "Go 2 hours without checking your phone in social settings", xp: 5, category: "action" },
  { id: "bc_37", title: "Walk confidently", description: "Walk with confident posture through a public area", xp: 5, category: "action" },
  { id: "bc_38", title: "Open body language", description: "Use open body language in all interactions today", xp: 5, category: "action" },
  { id: "bc_39", title: "Speak in mirror", description: "Practice speaking clearly to yourself in a mirror", xp: 5, category: "action" },
  { id: "bc_40", title: "Avoid fillers", description: 'Avoid filler words like "um" in conversations today', xp: 5, category: "action" },
  { id: "bc_41", title: "Make direct requests", description: "Make one direct request without hedging", xp: 5, category: "action" },
  { id: "bc_42", title: "Hold doors", description: "Hold the door open for others throughout the day", xp: 5, category: "action" },
  { id: "bc_43", title: "Wave to passersby", description: "Wave or nod to at least 5 passersby", xp: 5, category: "action" },
  { id: "bc_44", title: "Dress confidently", description: "Dress in a way that boosts your confidence", xp: 5, category: "action" },
  { id: "bc_45", title: "Try new route", description: "Take a new route or try a new activity publicly", xp: 5, category: "action" },
  { id: "bc_46", title: "Journal wins", description: "Write down 3 social wins from the past week", xp: 5, category: "reflection" },
  { id: "bc_47", title: "Identify patterns", description: "Reflect on what situations make you most anxious", xp: 5, category: "reflection" },
  { id: "bc_48", title: "Celebrate growth", description: "Write down how you've grown since starting this journey", xp: 5, category: "reflection" },
  { id: "bc_49", title: "Set an intention", description: "Set a specific social intention for tomorrow", xp: 5, category: "reflection" },
  { id: "bc_50", title: "Gratitude list", description: "List 3 people you're grateful to have in your life", xp: 5, category: "reflection" },
  { id: "bc_51", title: "Learn from setback", description: "Reflect on a recent awkward moment and what you learned", xp: 5, category: "reflection" },
  { id: "bc_52", title: "Review interactions", description: "Review your daily social interactions mentally", xp: 5, category: "reflection" },
  { id: "bc_53", title: "Note what went well", description: "Note three things that went well socially today", xp: 5, category: "reflection" },
  { id: "bc_54", title: "Plan improvement", description: "Plan one way to improve a social skill", xp: 5, category: "reflection" },
  { id: "bc_55", title: "Track anxiety", description: "Track your anxiety levels in different situations", xp: 5, category: "reflection" },
  { id: "bc_56", title: "Write about role model", description: "Write about a social role model and their qualities", xp: 5, category: "reflection" },
  { id: "bc_57", title: "Reflect on support", description: "Reflect on gratitude for your support network", xp: 5, category: "reflection" },
  { id: "bc_58", title: "Analyze success", description: "Analyze one recent social success in detail", xp: 5, category: "reflection" },
  { id: "bc_59", title: "Document milestones", description: "Document your progress milestones so far", xp: 5, category: "reflection" },
  { id: "bc_60", title: "Set weekly goals", description: "Set three social goals for the coming week", xp: 5, category: "reflection" },
];

export const getDailyBonusChallenge = (): BonusChallenge => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
  );
  return BONUS_CHALLENGES[dayOfYear % BONUS_CHALLENGES.length];
};
