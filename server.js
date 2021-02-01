require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const helmet = require('helmet')
const cors = require('cors')
const MOVIEDATA = require('./movies-data-small.json')

const app = express()

const morganSetting = process.env.NODE_ENV === 'production' ? 'tiny' : 'common'
app.use(morgan(morganSetting))
app.use(helmet())
app.use(cors())

app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN
    const authToken = req.get('Authorization')

    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        return res.status(401).json({ error: 'Unauthorized request' })
    }
    // move to the next middleware
    next()
})

function handleGetMovies(req, res) {
    let response = MOVIEDATA;

    if (req.query.genre) {
        //search to see if movie's genre includes a specific string, case insensitive
        response = response.filter(movie => 
            movie.genre.toLowerCase().includes(req.query.genre.toLowerCase())
        )
    }

    if (req.query.country) {
        //search to see if movie's country includes a specific string, case insensitive
        let countryQuery = req.query.country.split('%20').join(" ").toLowerCase();
        response = response.filter(movie => 
            movie.country.toLowerCase().includes(countryQuery)    
        )

    }

    if (req.query.avg_vote) {
        //search for movies with an equal to or greater avg_rating than what is supplied
        let rankingQuery = req.query.avg_vote;
        rankingQuery = parseFloat(rankingQuery);
        if (isNaN(rankingQuery)) {
            response = response;
        } else {
            response = response.filter(movie => 
                movie.avg_vote >= rankingQuery
            )
        }
    }

    res.json(response)
}

app.get('/movies', handleGetMovies)

app.use((error, req, res, next) => {
    let response
    if (process.env.NODE_ENV === 'production') {
      response = { error: { message: 'server error' }}
    } else {
      response = { error }
    }
    res.status(500).json(response)
})

const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})