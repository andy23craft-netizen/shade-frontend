import type { HomeQuote } from './homeQuotes'

export type HomeHeadingSet = Readonly<{ newAdditions: string; browse: string; staffPicks: string; currentReading: string; newReleases: string }>

const ORDINARY: HomeHeadingSet = { newAdditions: 'New Additions', browse: 'Browse the Stacks', staffPicks: 'Staff Picks', currentReading: 'Current Reading', newReleases: 'New Releases' }
const key = (quote: Pick<HomeQuote, 'author' | 'text'>) => `${quote.author}\n${quote.text}`
const headings = (newAdditions: string, browse: string, staffPicks: string, currentReading: string, newReleases: string): HomeHeadingSet => ({ newAdditions, browse, staffPicks, currentReading, newReleases })

const APPROVED: Readonly<Record<string, HomeHeadingSet>> = {
    'Franz Kafka\nA book must be the axe for the frozen sea inside us.': headings('New Cracks in the Ice', 'Beneath the Frozen Sea', 'The Sharpest Axes', 'Midway Through the Thaw', 'Fresh Against the Ice'),
    'Vladimir Nabokov\nKnowing you’ll have something good to read before bed is among the most pleasurable of sensations.': headings('New Bedside Temptations', 'Find Something for Tonight', 'Worth Staying Up For', 'On the Nightstand', "Tonight's New Temptations"),
    'Ursula K. Le Guin\nWe read books to find out who we are.': headings('New Mirrors Arrive', 'Who Might You Be?', 'Worth Finding Yourself In', 'The Search in Progress', 'Who We Might Become'),
    'Stephen King\nBooks are a uniquely portable magic.': headings('Magic, Newly Shelved', 'What Will You Summon?', 'Our Favorite Spells', 'Under the Spell', 'Freshly Conjured'),
    'George R. R. Martin\nA reader lives a thousand lives before he dies. The man who never reads lives only one.': headings('New Lives Arrive', 'Who Will You Be Next?', 'Some Lives Stay With You', "The Life I'm Living Now", 'Lives Yet Unlived'),
    'Jane Austen\nThe person, be it gentleman or lady, who has not pleasure in a good novel, must be intolerably stupid.': headings('For Persons of Sense', "Don't Be Intolerably Stupid", 'For Readers of Discernment', 'Proof of Good Judgment', 'New Pleasures for Sensible People'),
    'Emily Dickinson\nThere is no Frigate like a Book / To take us Lands away': headings('New Vessels in Port', 'Choose Your Passage', 'Worth the Voyage', 'Currently at Sea', 'Newly Charted Waters'),
    'Jhumpa Lahiri\nThat’s the thing about books. They let you travel without moving your feet.': headings('Destinations, Delivered', 'Go Somewhere', 'Journeys We Recommend', 'Currently Away', 'The World Just Got Bigger'),
    'Orhan Pamuk\nI read a book one day and my whole life was changed.': headings('Today Could Be the Day', 'Find the One', 'The Ones That Changed Us', 'Change in Progress', 'Change, Newly Published'),
    'Carlos Ruiz Zafón\nBooks are mirrors: you only see in them what you already have inside you.': headings('Newly on the Glass', 'Find Your Reflection', 'Our Clearest Reflections', 'In the Mirror Now', 'Fresh Reflections'),
    'Jorge Luis Borges\nI have always imagined that Paradise will be a kind of library.': headings('Heaven Got More Shelves', 'Wander Paradise', 'Worthy of Paradise', 'Currently in Paradise', 'Paradise Keeps Growing'),
    'Toni Morrison\nBooks are knowledge. Books are reflection. Books change your mind.': headings('New Knowledge Arrives', 'Find Something to Think About', 'Books That Changed Our Minds', 'Mind Currently Changing', 'New Ideas Enter the World'),
    'Francis Bacon\nSome books are to be tasted, others to be swallowed, and some few to be chewed and digested.': headings('Fresh on the Menu', 'Taste, Swallow, or Chew', "Chef's Choice", 'On the Plate', 'Fresh from the Kitchen'),
    'René Descartes\nThe reading of all good books is like a conversation with the most honorable people of past ages.': headings('New Voices at the Table', 'Join the Conversation', 'Distinguished Company', 'At the Table', 'The Conversation Continues'),
    'Carl Sagan\nBooks break the shackles of time, proof that humans can work magic.': headings('New Magic Across Time', 'Escape the Present', 'Worth Crossing Time For', 'Currently Outside Time', "Today's Messages Through Time"),
    'Virginia Woolf\nGood books are desirable.': headings('Recent Objects of Desire', 'Good Books This Way', 'Objects of Our Affection', 'Desire in Progress', 'Newly Desirable'),
    'C. S. Lewis\nA good book will be more; it must not be less.': headings('New Books, Never Less', 'Never Settle for Less', 'Books That Give More', 'More in Progress', 'Something More Is Coming'),
    'Maya Angelou\nWhen I look back, I am so impressed again with the life-giving power of literature.': headings('New Life on the Shelves', 'Find What Gives You Life', 'The Ones We Remember', 'Giving Life Now', 'Literature Keeps Living'),
    'William Styron\nA great book should leave you with many experiences, and slightly exhausted at the end.': headings('Fresh Experiences Arrive', 'What Will Wear You Out?', 'Worth the Exhaustion', 'Not Done Suffering Yet', 'New Ways to Suffer Beautifully'),
    'Thomas Jefferson\nI cannot live without books.': headings('Necessary Supplies', 'Survival Starts Here', "Books We Can't Live Without", 'Life Support', 'Further Means of Survival'),
}

export function homeHeadingsForQuote(quote: Pick<HomeQuote, 'author' | 'text'>): HomeHeadingSet {
    return APPROVED[key(quote)] ?? ORDINARY
}
