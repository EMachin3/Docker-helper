const express = require('express')
const cors = require('cors');

const bookRouter = require('./routes/book.route.js')
const altRouter = require('./routes/alt.route.js')

const app = express()

const allowedOrigins = ["http://localhost:5173"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(express.json())
app.use(cors(corsOptions))
app.use('/books', bookRouter)
app.use('/alt', altRouter)
app.use(express.static('public'))

module.exports = app
