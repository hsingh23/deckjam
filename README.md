# deckjam.org
## Welcome to Deckjam
Deckjam is a flash card curation tool.  
It is for students, teachers, and life long learners. Flashcards are proven to improve recognition and recall, yet creating flashcards is tedious. With deckjam you pick flashcards from many flashcards set to make your own flashcard set. Finally, export to quizlet.com where you can play games and test yourself on your carefully chosen set.

## Trivia
**Why Deckjam?**  
With deckjam, you can find flashcards that match your expression style. Each search provides relevant results allowing you to quickly build concise learning materials to prepare for tests and also engage in lifelong learning. Since cards are stored on quizlet, you can easily access them anywhere with rich mobile friendly apps and interactive games.

**Why is it called deckjam?**  
This app lets you pack together your favorite flashcards. It allows for improvised creation and curation of study material. Since the end product is a flashcard deck, deckjam just made sense.

## Development
app.js and index.jade contain the whole app. 

Use jade/pug to turn jade into html
`pug -w .`

Use Babel to turn things into browser supported js
`babel app.js  --out-file app.prod.js  --watch --source-maps --presets latest`
