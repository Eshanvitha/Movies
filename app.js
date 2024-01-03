const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'moviesData.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server started')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertMovieName = dbObject => {
  return {
    movieName: dbObject.movie_name,
  }
}

app.get('/movies/', async (request, response) => {
  const getAllMovies = `SELECT movie_name FROM movie;`
  const allMovieNamesArray = await db.all(getAllMovies)
  response.send(
    allMovieNamesArray.map(moviename => convertMovieName(moviename)),
  )
})

app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const addMovie = `INSERT INTO movie(director_id,movie_name,lead_actor)
  VALUES('${directorId}','${movieName}','${leadActor}');`
  const dbResponse = await db.run(addMovie)
  response.send('Movie Successfully Added')
})

const convertDbObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

app.get('/movies/:movieId', async (request, response) => {
  const {movieId} = request.params
  const getMovie = `SELECT * FROM movie WHERE movie_id=${movieId};`
  const movie = await db.get(getMovie)
  console.log(movieId)
  response.send(convertDbObjectToResponseObject(movie))
})

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const updateMovie = `UPDATE 
  movie
  SET 
  director_id='${directorId}',
  movie_name='${movieName}',
  lead_actor='${leadActor}'
  WHERE 
  movie_id=${movieId};`
  await db.run(updateMovie)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId', async (request, response) => {
  const {movieId} = request.params
  const deleteMovie = `DELETE FROM movie WHERE movie_id=${movieId};`
  await db.run(deleteMovie)
  response.send('Movie Removed')
})

const convertDirectorDetails = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

app.get('/directors/', async (request, response) => {
  const getAllDirectors = `SELECT * FROM director;`
  const directorsArray = await db.all(getAllDirectors)
  response.send(
    directorsArray.map(director =>
      convertDirectorDetails(director),
    ),
  )
})

const convertMovieName = dbObject => {
  return {
    movieName: dbObject.movie_name,
  }
}

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getDirectorMovies = `SELECT
   movie_name 
   FROM 
   director INNER JOIN movie 
   ON director.director_id=movie.director_id
   WHERE director_id=${directorId};`
  const movies = await db.all(getDirectorMovies)
  console.log(directorId)
  response.send(
    movies.map(movienames => convertMovieName(movienames)),
  )
})

module.exports = app
