const express = require('express'),
morgan = require('morgan'),
fs = require('fs'),
path = require('path');

const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});

let topMovies = [
    {
        title:'Big Fish'
    },
    {
        title:'Inception'
    },
    {
        title:'In the Mood for Love'
    },
    {
        title:'Matchpoint'
    },
    {
        title:'Pulp Fiction'
    },
    {
        title:'Ratatouille'
    },
    {
        title:'Star Wars'
    },
    {
        title:'Star Wars: Episode VI - Return of the Jedi'
    },
    {
        title:'The Empire Strikes Back'
    },
    {
        title:'WALL-E'
    }
]


// log all requests
app.use(morgan('combined', {stream: accessLogStream}));

// Express GET route located at the endpoint “/” that returns a default textual response
app.get('/', (req, res) => {
    res.send('Welcome to MyFlix!');
});

// Express GET route located at the endpoint "/movies" that returns a JSON object containing data about your top 10 movies
app.get('/movies', (req, res) => {
  res.json(topMovies);
});

// Express GET route located at the endpoint "/documentation" that returns “documentation.html” file to the browser
app.get('/documentation', (req, res) => {                  
    res.sendFile('public/documentation.html', { root: __dirname });
  });

// express.static() function to serve “documentation.html” file from the public folder
app.use(express.static('public'));

const bodyParser = require('body-parser'),
  methodOverride = require('method-override');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride()); 
// error-handling middleware function that will log all application-level errors to the terminal
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

// listen for requests
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});