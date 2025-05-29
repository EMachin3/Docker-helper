const express = require('express')
const cors = require('cors');
const bodyParser = require("body-parser");
const FileSystem = require("fs");

const bookRouter = require('./routes/book.route.js')
const altRouter = require('./routes/alt.route.js')
let userContainers = JSON.parse(FileSystem.readFileSync('./user_config/user_containers.json'));

const api_url = "https://api.linuxserver.io/api/v1/images?include_config=true&include_deprecated=false";
let linuxserver_containers = [];

let isReady = false;

async function getContainers() {
  let response = await fetch(api_url);
  response = await response.json();
  linuxserver_containers = response.data.repositories.linuxserver;
  isReady = true;
}

getContainers();

// function checkReadiness(req, res, next) {
//   if (!isReady) {
//     setTimeout(checkReadiness, 1000);
//   }
//   next();
// }

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
app.use(bodyParser.json());

app.use('/books', bookRouter)
app.use('/alt', altRouter)
app.use(express.static('public'))

//checks if the setup process is done before returning the API result
app.get('/api/linuxserver_data', (req, res) => {
  res.json(linuxserver_containers);
});

//TODO: see if this and maybe previous can be refactored out to an API route
app.get('/api/user_containers', (req, res) => {
  res.json(userContainers);
});

app.post('/api/user_containers', (req, res) => {
  //TODO: is this a bad idea?
  // console.log("const userContainers = " + JSON.stringify(req.body) + "\n\nmodule.exports = userContainers");
  userContainers.push(req.body);
  // const serializedUserContainers = "const userContainers = " + JSON.stringify(userContainers) + "\n\nmodule.exports = userContainers"
  FileSystem.writeFile('./user_config/user_containers.json', JSON.stringify(userContainers), (error) => {
    if (error) throw error;
  });
  res.json({ result: 'success' })
});

module.exports = app
