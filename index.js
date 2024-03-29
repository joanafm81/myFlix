
const express = require('express'),
    app = express(),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    uuid = require('uuid'),
    mongoose = require('mongoose'),
    Models = require('./models.js'),
    Movies = Models.Movie,
    Users = Models.User,
    cors = require('cors');
//passport = require('passport');
//let auth = require('./auth')(app);
//require('./passport');

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

//const cors = require('cors');
app.use(cors());

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

const { check, validationResult } = require('express-validator');

//Allows Mongoose to connect to the database so it can perform CRUD operations on the documents it contains from within the REST API.
//mongoose.connect('mongodb://127.0.0.1:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

// log all requests
app.use(morgan('combined', { stream: accessLogStream }));

// * @summary Express GET route located at the endpoint “/” that returns a default textual response
// * @return {object} 200 - success response - application/json

/**
 * GET welcome message from '/' endpoint
 * @name welcomeMessage
 * @kind function
 * @returns welcome message
 */
app.get('/', (req, res) => {
    res.send('Welcome to MyFlix!');
});

/**
 * GET the API documentation at the "/documentation" endpoint
 * @name documentation
 * @kind function
 * @returns the contents of documentation.html
 */
app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', { root: __dirname });
});

// express.static() function to serve “documentation.html” file from the public folder
app.use(express.static('public'));

//// READ - Express GET route located at the endpoint "/movies" that returns a JSON object containing data about all movies

/**
 * GET a list of all movies at the "/movies" endpoint
 * @name movies
 * @kind function
 * @returns array of movie objects
 * @requires passport
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(200).json(movies);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

//// READ - Express GET route located at the endpoint "/users" that returns a JSON object containing data about all users

/**
 * GET a list of all users at the "/users" endpoint
 * @name users
 * @kind function
 * @returns array of user objects
 */
app.get('/users',
    //passport.authenticate('jwt', { session: false }),  
    (req, res) => {
        Users.find()
            .then((users) => {
                res.status(200).json(users);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
    });

// READ - Express GET route located at the endpoint "/movies/[Title]" that returns data about a single movie by title to the user

/**
 * GET a single movie by title at the "/movies/[Title]" endpoint
 * @name movie
 * @param {string} title movie title
 * @kind function
 * @returns movie object
 * @requires passport
 */
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ Title: req.params.title })
        .then((movie) => {
            if (movie) {
                res.status(200).json(movie);
            } else {
                res.status(404).send('No such movie.');
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

// READ - Express GET route located at the endpoint "/movies/[Genre]/[Name]" that returns data about a genre (description) by name

/**
 * GET a genre (description) by name the "/movies/[Genre]/[Name]" endpoint
 * @name genre
 * @param {string} genreName genre name
 * @kind function
 * @returns genre object
 * @requires passport
 */
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ 'Genre.Name': req.params.genreName })
        .then((movie) => {
            if (movie) {
                res.status(200).json(movie.Genre);
            } else {
                res.status(404).send('No such genre.')
            }
        })
        .catch((error) => {
            console.error(err);
            res.status(500).send('Error: ' + error);
        });
});

// READ - Express GET route located at the endpoint "/movies/[Director]/[Name]" that returns data about data about a director by name

/**
 * GET a director by name at the "/movies/[Director]/[Name]" endpoint
 * @name director
 * @param {string} directorName director name
 * @kind function
 * @returns director object
 * @requires passport
 */
app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.directorName })
        .then((movie) => {
            if (movie) {
                res.status(200).json(movie.Director);
            } else {
                res.status(404).send('No such director.')
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

//CREATE - Allow new users to register

/**
 * Allow new users to register
 * @name registerUser
 * @param {string} Username username
 * @param {string} Password password
 * @param {string} Email email
 * @param {date} Birthday birthday
 * @kind function
 */
app.post('/users',
    // passport.authenticate('jwt', { session: false }), 
    [
        check('Username', 'Username is required (must have a minimum of 5 characters).').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Password', 'Password must have a mininum of 8 characters.').isLength({ min: 8 }),
        check('Email', 'Email does not appear to be valid').isEmail()
    ], (req, res) => {
        //Check the validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOne({ Username: req.body.Username })
            .then((user) => {
                if (user) {
                    return res.status(404).send(req.body.Username + 'already exists.');
                } else {
                    Users.create({
                        Username: req.body.Username,
                        Password: hashedPassword,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday,
                    })
                        .then((user) => {
                            res.status(201).json(user)
                        })
                        .catch((error) => {
                            console.error(error);
                            res.status.send('Error: ' + error);
                        })
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
    });

//UPDATE - Allow users to update their user info (username)

/**
 * Allow users to update their user info (except username)
 * @name updateUser
 * @param {string} Username username
 * @param {string} Password password
 * @param {string} Email email
 * @param {date} Birthday birthday
 * @kind function
 * @requires passport
 */
app.put('/users/:username', passport.authenticate('jwt', { session: false }),
    [
        check('Password', 'Password is required').not().isEmpty(),
        check('Password', 'Password must have a mininum of 8 characters.').isLength({ min: 8 }),
        check('Email', 'Email does not appear to be valid').isEmail()
    ], (req, res) => {
        //Check the validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOneAndUpdate({ Username: req.params.username }, {
            $set:
            {
                Password: hashedPassword,
                Email: req.body.Email,
                Birthday: req.body.Birthday,
            }
        },
            { new: true })
            .then((updatedUser) => {
                if (updatedUser) {
                    res.status(200).json(updatedUser); /*Response: Updated user. The response shoudld be a message indicating the username was updated, according to the documentation.*/
                } else {
                    res.status(404).send('No such user.');
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
    });

//CREATE - Allow users to add a movie to their list of favorites (showing only a text that a movie has been added)

/**
 * Allow users to add a movie to their list of favorites (showing only a text that a movie has been added)
 * @name addFavoriteMovie
 * @param {string} Username username
 * @param {string} movieId movie ID
 * @kind function
 * @requires passport
 */
app.post('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.username },
        {
            $push:
                { FavoriteMovies: req.params.movieId }
        },
        { new: true })
        .then((updatedUser) => {
            if (updatedUser) {
                res.status(200).send(`${req.params.movieId} has been added to user ${req.params.username}'s array.`);
            } else {
                res.status(404).send('No such user.');
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

//DELETE - Allow users to remove a movie from their list of favorites (showing only a text that a movie has been removed)

/**
 * Allow users to remove a movie from their list of favorites (showing only a text that a movie has been removed)
 * @name removeFavoriteMovie
 * @param {string} Username username
 * @param {string} movieId movie ID
 * @kind function
 * @requires passport
 */
app.delete('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.username },
        {
            $pull:
                { FavoriteMovies: req.params.movieId }
        },
        { new: true })
        .then((updatedUser) => {
            if (updatedUser) {
                res.status(200).send(`${req.params.movieId} has been removed user ${req.params.username}'s array.`);
            } else {
                res.status(404).send('No such user.');
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});


//DELETE - Allow existing users to deregister (showing only a text that a user has been removed)

/**
 * Allow existing users to deregister (showing only a text that a user has been removed)
 * @name removeUser
 * @param {string} id user ID
 * @kind function
 * @requires passport
 */
app.delete('/users/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndRemove({ _id: req.params.id })
        .then((user) => {
            if (user) {
                res.status(200).send(req.params.id + ' was removed.');
            } else {
                res.status(404).send(req.params.id + ' was not found.');
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

app.use(methodOverride());
// error-handling middleware function that will log all application-level errors to the terminal
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// listen for requests
/*app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});*/
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});