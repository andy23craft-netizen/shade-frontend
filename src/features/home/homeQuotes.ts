export interface HomeQuote {
    text: string
    author: string
    context: string
}

export const HOME_QUOTES: readonly HomeQuote[] = [
    {
        text: 'A book must be the axe for the frozen sea inside us.',
        author: 'Franz Kafka',
        context:
            'From a letter to Oskar Pollak, January 27, 1904.',
    },
    {
        text: 'Knowing you’ll have something good to read before bed is among the most pleasurable of sensations.',
        author: 'Vladimir Nabokov',
        context:
            'Nabokov, discussing the pleasure of having something good to read before bed.',
    },
    {
        text: 'We read books to find out who we are.',
        author: 'Ursula K. Le Guin',
        context:
            'From “Prophets and Mirrors: Science Fiction as a Way of Seeing,” collected in The Language of the Night.',
    },
    {
        text: 'Books are a uniquely portable magic.',
        author: 'Stephen King',
        context:
            'From On Writing: A Memoir of the Craft.',
    },
    {
        text: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.',
        author: 'George R. R. Martin',
        context:
            'Spoken by Jojen Reed in A Dance with Dragons.',
    },
    {
        text: 'The person, be it gentleman or lady, who has not pleasure in a good novel, must be intolerably stupid.',
        author: 'Jane Austen',
        context:
            'From Northanger Abbey, Chapter 14.',
    },
    {
        text: 'There is no Frigate like a Book / To take us Lands away',
        author: 'Emily Dickinson',
        context:
            'From Emily Dickinson’s poem commonly known by its first line.',
    },
    {
        text: 'That’s the thing about books. They let you travel without moving your feet.',
        author: 'Jhumpa Lahiri',
        context:
            'From The Namesake.',
    },
    {
        text: 'I read a book one day and my whole life was changed.',
        author: 'Orhan Pamuk',
        context:
            'The opening sentence of The New Life.',
    },
    {
        text: 'Books are mirrors: you only see in them what you already have inside you.',
        author: 'Carlos Ruiz Zafón',
        context:
            'From The Shadow of the Wind.',
    },
    {
        text: 'I have always imagined that Paradise will be a kind of library.',
        author: 'Jorge Luis Borges',
        context:
            'One of Borges’s best-known observations about books and libraries.',
    },
    {
        text: 'Books are knowledge. Books are reflection. Books change your mind.',
        author: 'Toni Morrison',
        context:
            'From Morrison’s longer statement about books as a form of political action.',
    },
    {
        text: 'Some books are to be tasted, others to be swallowed, and some few to be chewed and digested.',
        author: 'Francis Bacon',
        context:
            'From the essay “Of Studies.”',
    },
    {
        text: 'The reading of all good books is like a conversation with the most honorable people of past ages.',
        author: 'René Descartes',
        context:
            'From Discourse on Method.',
    },
    {
        text: 'Books break the shackles of time, proof that humans can work magic.',
        author: 'Carl Sagan',
        context:
            'From Cosmos.',
    },
    {
        text: 'Good books are desirable.',
        author: 'Virginia Woolf',
        context:
            'From A Room of One’s Own.',
    },
    {
        text: 'A good book will be more; it must not be less.',
        author: 'C. S. Lewis',
        context:
            'From An Experiment in Criticism, discussing the necessity that a good book at least entertain.',
    },
    {
        text: 'When I look back, I am so impressed again with the life-giving power of literature.',
        author: 'Maya Angelou',
        context:
            'Angelou reflecting on literature and reading as a way of understanding oneself.',
    },
    {
        text: 'A great book should leave you with many experiences, and slightly exhausted at the end.',
        author: 'William Styron',
        context:
            'Styron on the experience of living several lives through reading.',
    },
    {
        text: 'I cannot live without books.',
        author: 'Thomas Jefferson',
        context:
            'From Jefferson’s correspondence with John Adams.',
    },
]

export function randomHomeQuote(
    random = Math.random,
): HomeQuote {
    const index = Math.floor(
        random() * HOME_QUOTES.length,
    )

    return HOME_QUOTES[index]
}
