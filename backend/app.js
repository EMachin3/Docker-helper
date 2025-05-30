const express = require('express')
const cors = require('cors');
const bodyParser = require("body-parser");
const FileSystem = require("fs");
const { execFile } = require('node:child_process');

const bookRouter = require('./routes/book.route.js')
const altRouter = require('./routes/alt.route.js')
let userContainers = JSON.parse(FileSystem.readFileSync('./user_config/user_containers.json'));
let testContainers = JSON.parse(FileSystem.readFileSync('./user_config/test_containers.json'));

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

//TODO: remove this endpoint at some point
app.get('/api/test_containers', (req, res) => {
  res.json(testContainers);
});

app.post('/api/user_containers', (req, res) => {
  //TODO: is this a bad idea?
  // console.log("const userContainers = " + JSON.stringify(req.body) + "\n\nmodule.exports = userContainers");
  //run docker pull then, only after docker pull terminates, run the callback
  //which contains the rest of the API handling code. that way, the API call
  //doesn't finish until running the command finishes.
  execFile('docker', ['pull', `lscr.io/linuxserver/${req.body.name}:latest`], (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ result: 'error', message: stderr });
    }

    userContainers.push(req.body);
    FileSystem.writeFile('./user_config/user_containers.json', JSON.stringify(userContainers), (writeErr) => {
      if (writeErr) {
        return res.status(500).json({ result: 'error', message: 'Failed to update user containers' });
      }
      res.json({ result: 'success' });
    });
  });
  /*console.log(`docker pull lscr.io/linuxserver/${req.body.name}:latest`)
  //TODO: ideal approach would be to change the icon to a "waiting" icon, 
  //then do API request, and once the request is done refresh to remove the
  //container..
  userContainers.push(req.body);
  // const serializedUserContainers = "const userContainers = " + JSON.stringify(userContainers) + "\n\nmodule.exports = userContainers"
  FileSystem.writeFile('./user_config/user_containers.json', JSON.stringify(userContainers), (error) => {
    if (error) throw error;
  });
  res.json({ result: 'success' })*/
});

//TODO: request body needs to contain the ID of the container to run or something.
//right now I'm just dealing with the test container though
//more "accurate" description: you can run an image on its own. that will create
//a container on its own. however, a "stretch goal" (probably an MVP but something
//that will be done later) is to be able to resume containers that were previously
//stopped. after you start a container using docker run -d, the only thing
//outputted to the terminal will be the container ID. you should store an array
//of existing container ID's in the JSON for each image. that way, you can
//resume a specific existing container using docker start (containerID) in
//the backend.
app.post('/api/run_container', (req, res) => {
  // let container_command = `docker run -d --name=${req.body.name} `;
  let run_arguments = ['run', '-d', `--name=${req.body.name}`];
  //TODO: obviously this needs to be handled differently. the values
  //that I'm using here are just placeholder values that would be displayed
  //when the form is first displayed to the user.
  // container_command += req.body.config.env_vars.map(envVar => `-e ${envVar.name}=${envVar.value}`).join(' ') + ' ';
  req.body.config.env_vars.forEach(envVar => {
    run_arguments.push('-e');
    run_arguments.push(`${envVar.name}=${envVar.value}`);
  });
  // container_command += req.body.config.volumes.map(volume => `-v ${volume.host_path}:${volume.path}`).join(' ') + ' ';
  req.body.config.volumes.forEach(volume => {
    run_arguments.push('-v');
    run_arguments.push(`${volume.host_path}:${volume.path}`);
  });
  // container_command += req.body.config.ports.map(port => `-p ${port.external}:${port.internal}`).join(' ') + ' ';
  req.body.config.ports.forEach(port => {
    run_arguments.push('-p');
    run_arguments.push(`${port.external}:${port.internal}`);
  });
  run_arguments.push('--restart');
  run_arguments.push('unless-stopped');
  run_arguments.push(`lscr.io/linuxserver/${req.body.name}:latest`);
  //TODO: does every repo have the same setting for restart?
  // container_command += '--restart unless-stopped ' + `lscr.io/linuxserver/${req.body.name}:latest`;
  // console.log(container_command);
  console.log('docker ' + run_arguments.join(' '));
  execFile('docker', run_arguments, (error, stdout, stderr) => {
    if (error) {
      console.log(stderr);
      return res.status(500).json({ result: 'error', message: stderr });
    }

    //TODO: here we would write the container ID from stdout to the JSON file somehow.
    // userContainers.push(req.body);
    // FileSystem.writeFile('./user_config/user_containers.json', JSON.stringify(userContainers), (writeErr) => {
    //   if (writeErr) {
    //     return res.status(500).json({ result: 'error', message: 'Failed to update user containers' });
    //   }
    //   res.json({ result: 'success' });
    // });
    res.json({ result: 'success' });
  });
  // res.json({ result: 'success' });
});

module.exports = app
