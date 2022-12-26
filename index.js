const express = require('express'),
app = express(),
morgan = require('morgan'),
fs = require('fs'),
path = require('path'),
bodyParser = require('body-parser'),
methodOverride = require('method-override'),
uuid = require('uuid');

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});

let users = [
    {
        id: 1,
        name: "Mariana",
        favoriteMovies: []
    },
    {
        id: 2,
        name: "Daniel",
        favoriteMovies: ["The Fountain"]
    }
];

let movies = [
    {
        Title: 'Big Fish',
        Description: 'A frustrated son tries to determine the fact from fiction in his dying father\'s life.',
        Genre: {
            Name:'Adventure',
            Description: ''
        },
        Director: {
            Name:'Tim Burton',
            Bio: 'Timothy Walter Burton was born in Burbank, California, to Jean Rae (Erickson), who owned a cat-themed gift shop, and William Reed Burton, who worked for the Burbank Park and Recreation Department. He spent most of his childhood as a recluse, drawing cartoons, and watching old movies (he was especially fond of films with Vincent Price). When he was in the ninth grade, his artistic talent was recognized by a local garbage company, when he won a prize for an anti-litter poster he designed. The company placed this poster on all of their garbage trucks for a year. After graduating from high school, he attended California Institute of the Arts. Like so many others who graduated from that school, Burton\'s first job was as an animator for Disney. (...)',
            Birth: '1958-08-25',
            Death:''
        },
        ImageURL:'https://www.imdb.com/title/tt0319061/mediaviewer/rm344332545/?ref_=tt_ov_i',
        Featured: false
    }
];

app.use(bodyParser.json());

// log all requests
app.use(morgan('combined', {stream: accessLogStream}));

// Express GET route located at the endpoint “/” that returns a default textual response
app.get('/', (req, res) => {
    res.send('Welcome to MyFlix!');
});

// Express GET route located at the endpoint "/documentation" that returns “documentation.html” file to the browser
app.get('/documentation', (req, res) => {                  
    res.sendFile('public/documentation.html', { root: __dirname });
  });

// express.static() function to serve “documentation.html” file from the public folder
app.use(express.static('public'));

//// READ - Express GET route located at the endpoint "/movies" that returns a JSON object containing data about all movies

app.get('/movies', (req, res) => {
    res.status(200).json(movies);
});

// READ - Express GET route located at the endpoint "/movies/[Title]" that returns data about a single movie by title to the user
app.get('/movies/:title', (req, res) => {
    //const title = req.params.title;
    const { title } = req.params;
    const movie = movies.find( movie => movie.Title === title );

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(404).send('No such movie.')
    }
});

// READ - Express GET route located at the endpoint "/movies/[Director]/[Name]" that returns data about data about a director by name
app.get('/movies/director/:directorName', (req, res) => {
    const { directorName } = req.params;
    const director = movies.find( movie => movie.Director.Name === directorName ).Director;

    if (director) {
        res.status(200).json(director);
    } else {
        res.status(404).send('No such director.')
    }
});

//CREATE - Allow new users to register
app.post('/users', (req, res) => {
    const newUser = req.body;
    if (newUser.name) {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).json(newUser);
    } else {
        res.status(400).send('Users need names.')
    }
});

//UPDATE - Allow users to update their user info (username)
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const updatedUser = req.body;
    
    let user = users.find ( user => user.id == id );

    if (user) {
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(404).send('No such user.');
    }
});

//CREATE - Allow users to add a movie to their list of favorites (showing only a text that a movie has been added)
app.post('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle} = req.params;
    
    let user = users.find ( user => user.id == id );

    if (user) {
        user.favoriteMovies.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to user ${id}'s array.`);
    } else {
        res.status(404).send('No such user.');
    }
});

//DELETE - Allow users to remove a movie from their list of favorites (showing only a text that a movie has been removed)
app.delete('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle} = req.params;
    
    let user = users.find ( user => user.id == id );

    if (user) {
        user.favoriteMovies.filter( title => title !== movieTitle);
        res.status(200).send(`${movieTitle} has been removed from user ${id}'s array.`);
    } else {
        res.status(404).send('No such user.');
    }
});

//DELETE - Allow existing users to deregister (showing only a text that a user email has been removed)
app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    
    let user = users.find ( user => user.id == id );

    if (user) {
        users = users.filter( user => user.id != id);
        res.status(200).send(`User ${id} has been removed.`);
    } else {
        res.status(404).send('No such user.');
    }
});

app.use(bodyParser.urlencoded({
  extended: true
}));

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