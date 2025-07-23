const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const FileSystem = require("fs");
const { execFile } = require("node:child_process");

const bookRouter = require("./routes/book.route.js");
const altRouter = require("./routes/alt.route.js");
let userContainers = JSON.parse(
  FileSystem.readFileSync("./user_config/user_containers.json"),
);

const api_url =
  "https://api.linuxserver.io/api/v1/images?include_config=true&include_deprecated=false";
let linuxserver_containers = [];

let isReady = false;

//userContainersLock is a global lock used to ensure that only one API call can access
//the user_containers file at any given time. this ensures that multiple containers
//can be pulled at once in a thread-safe manner.
let userContainersLock = false;
function writeUserContainers(data, callback) {
  if (userContainersLock) {
    //use recursion to poll until the lock is released
    return setTimeout(() => writeUserContainers(data, callback), 100);
  }
  userContainersLock = true;
  FileSystem.writeFile(
    "./user_config/user_containers.json",
    JSON.stringify(data),
    (err) => {
      userContainersLock = false;
      callback(err);
    },
  );
}

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

const app = express();

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

app.use(express.json());
app.use(cors(corsOptions));
app.use(bodyParser.json());

app.use("/books", bookRouter);
app.use("/alt", altRouter);
app.use(express.static("public"));

//checks if the setup process is done before returning the API result
app.get("/api/linuxserver_data", (req, res) => {
  res.json(linuxserver_containers);
});

//TODO: see if this and maybe previous can be refactored out to an API route
app.get("/api/user_containers", (req, res) => {
  res.json(userContainers);
});

app.get("/api/user_containers/running", (req, res) => {
  execFile("docker", ["ps", "--no-trunc"], (err, stdout, stderr) => {
    let out_lines = stdout.split("\n");
    out_lines.splice(0, 1);
    out_lines.splice(-1, 1);
    const curr_running = out_lines.map((line) => line.split("   ")[0]);
    res.json(
      userContainers.filter((container) =>
        curr_running.some((cur) => cur === container.id),
      ),
    );
  });
});

app.post("/api/user_containers", (req, res) => {
  //TODO: is this a bad idea?
  // console.log("const userContainers = " + JSON.stringify(req.body) + "\n\nmodule.exports = userContainers");
  //run docker pull then, only after docker pull terminates, run the callback
  //which contains the rest of the API handling code. that way, the API call
  //doesn't finish until running the command finishes.
  execFile(
    "docker",
    ["pull", `lscr.io/linuxserver/${req.body.name}:latest`],
    (error, stdout, stderr) => {
      console.log(stdout);
      if (error) {
        console.log(stderr);
        return res.status(500).json({ result: "error", message: stderr });
      }

      userContainers.push(req.body);
      writeUserContainers(userContainers, (err) => {
        if (err) {
          return res.status(500).json({
            result: "error",
            message: "Failed to update user containers",
          });
        }
        res.json({ result: "success" });
      });
      // FileSystem.writeFile('./user_config/user_containers.json', JSON.stringify(userContainers), (writeErr) => {
      //   if (writeErr) {
      //     return res.status(500).json({ result: 'error', message: 'Failed to update user containers' });
      //   }
      //   res.json({ result: 'success' });
      // });
    },
  );
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

app.put("/api/user_containers", (req, res) => {
  //if there is a container for this image, remove it, because you can't change
  //the config for a container as far as i know
  if (req.body.id) {
    execFile("docker", ["rm", `${req.body.id}`], (error, stdout, stderr) => {
      console.log(stdout);
      if (error) {
        console.log(stderr);
        return res.status(500).json({ result: "error", message: stderr });
      }
      const container_index = userContainers.findIndex(
        (container) => container.name === req.body.name,
      );
      userContainers[container_index] = req.body;
      delete userContainers[container_index].id;
      // console.log(userContainers[container_index]);

      writeUserContainers(userContainers, (err) => {
        if (err) {
          return res.status(500).json({
            result: "error",
            message: "Failed to update user containers",
          });
        }
        res.json({ result: "success" });
      });
    });
  } else {
    //TODO: i feel like i shouldn't be repeating code here
    const container_index = userContainers.findIndex(
      (container) => container.name === req.body.name,
    );
    userContainers[container_index] = req.body; //make sure there's no extra fields or whatever

    writeUserContainers(userContainers, (err) => {
      if (err) {
        return res.status(500).json({
          result: "error",
          message: "Failed to update user containers",
        });
      }
      res.json({ result: "success" });
    });
  }
});

app.delete("/api/user_containers", (req, res) => {
  //if there is a container for this image, remove it, because trying to remove
  //the image without removing the container will cause errors.
  if (req.body.id) {
    execFile("docker", ["rm", `${req.body.id}`], (error, stdout, stderr) => {
      console.log(stdout);
      if (error) {
        console.log(stderr);
        return res.status(500).json({ result: "error", message: stderr });
      }
      //now, remove the image.
      execFile(
        "docker",
        ["image", "remove", `lscr.io/linuxserver/${req.body.name}:latest`],
        (error, stdout, stderr) => {
          console.log(stdout);
          if (error) {
            console.log(stderr);
            return res.status(500).json({ result: "error", message: stderr });
          }

          const container_index = userContainers.findIndex(
            (container) => container.name === req.body.name,
          );
          //remove the container from the list and shift
          userContainers.splice(container_index, 1);

          writeUserContainers(userContainers, (err) => {
            if (err) {
              return res.status(500).json({
                result: "error",
                message: "Failed to update user containers",
              });
            }
            res.json({ result: "success" });
          });
        },
      );
    });
  } else {
    //TODO: i feel like i shouldn't be repeating code here but i need to know
    //that deleting the image comes after the container is removed so
    //deleting the container can't go in an optional if branch right?
    //i'm assuming execFile is nonblocking so the only way to ensure
    //sequential execution of the remaining code is to nest it inside
    //the callback.
    execFile(
      "docker",
      ["image", "remove", `lscr.io/linuxserver/${req.body.name}:latest`],
      (error, stdout, stderr) => {
        console.log(stdout);
        if (error) {
          console.log(stderr);
          return res.status(500).json({ result: "error", message: stderr });
        }

        const container_index = userContainers.findIndex(
          (container) => container.name === req.body.name,
        );
        //remove the container from the list and shift
        userContainers.splice(container_index, 1);

        writeUserContainers(userContainers, (err) => {
          if (err) {
            return res.status(500).json({
              result: "error",
              message: "Failed to update user containers",
            });
          }
          res.json({ result: "success" });
        });
      },
    );
  }
});

//TODO: instead of using this probably just use the put endpoint.
//this doesn't work anyways because it doesn't delete the container
//if there is an existing container
//TODO: delete this
app.delete("/api/user_containers/:name/env_var/:env_name", (req, res) => {
  const container_index = userContainers.findIndex(
    (container) => container.name === req.params.name,
  );
  const env_index = userContainers[container_index].config.env_vars.findIndex(
    (env_var) => env_var.name === req.params.env_name,
  );
  userContainers[container_index].config.env_vars.splice(env_index, 1);
  writeUserContainers(userContainers, (err) => {
    if (err) {
      return res.status(500).json({
        result: "error",
        message: "Failed to update user containers",
      });
    }
    res.json({ result: "success", container: userContainers[container_index] });
  });
});

app.post("/api/run_container", (req, res) => {
  // let container_command = `docker run -d --name=${req.body.name} `;
  let run_arguments = ["run", "-d", `--name=${req.body.name}`];
  // console.log('Request body: ' + JSON.stringify(req.body, null, 2));
  //TODO: obviously this needs to be handled differently. the values
  //that I'm using here are just placeholder values that would be displayed
  //when the form is first displayed to the user.
  // container_command += req.body.config.env_vars.map(envVar => `-e ${envVar.name}=${envVar.value}`).join(' ') + ' ';
  //TODO: this is optional because I ran into an issue of the API response for radarr not having this field.
  //not sure if this is intentional or an error on the part of linuxserver.
  req.body.config.env_vars?.forEach((envVar) => {
    run_arguments.push("-e");
    run_arguments.push(`${envVar.name}=${envVar.value}`);
  });
  // container_command += req.body.config.volumes.map(volume => `-v ${volume.host_path}:${volume.path}`).join(' ') + ' ';
  //made this optional also for the previous reason
  req.body.config.volumes?.forEach((volume) => {
    run_arguments.push("-v");
    run_arguments.push(`${volume.host_path}:${volume.path}`);
  });
  // container_command += req.body.config.ports.map(port => `-p ${port.external}:${port.internal}`).join(' ') + ' ';
  //check if making this optional is necessary
  req.body.config.ports?.forEach((port) => {
    run_arguments.push("-p");
    run_arguments.push(`${port.external}:${port.internal}`);
  });
  run_arguments.push("--restart");
  run_arguments.push("unless-stopped");
  run_arguments.push(`lscr.io/linuxserver/${req.body.name}:latest`);
  //TODO: does every repo have the same setting for restart?
  // container_command += '--restart unless-stopped ' + `lscr.io/linuxserver/${req.body.name}:latest`;
  // console.log(container_command);
  console.log("docker " + run_arguments.join(" "));
  execFile("docker", run_arguments, (error, stdout, stderr) => {
    if (error) {
      console.log(stderr);
      return res.status(500).json({ result: "error", message: stderr });
    }
    const container_index = userContainers.findIndex(
      (container) => container.name === req.body.name,
    );
    userContainers[container_index].id = stdout.split("\n")[0];

    // userContainers.push(req.body);
    // FileSystem.writeFile('./user_config/user_containers.json', JSON.stringify(userContainers), (writeErr) => {
    //   if (writeErr) {
    //     return res.status(500).json({ result: 'error', message: 'Failed to update user containers' });
    //   }
    //   res.json({ result: 'success' });
    // });
    writeUserContainers(userContainers, (err) => {
      if (err) {
        return res.status(500).json({
          result: "error",
          message: "Failed to update user containers",
        });
      }
      res.json({
        result: "success",
        container_id: userContainers[container_index].id,
      });
    });
    // FileSystem.writeFile('./user_config/user_containers.json', JSON.stringify(userContainers), (writeErr) => {
    //   if (writeErr) {
    //     return res.status(500).json({ result: 'error', message: 'Failed to update user containers' });
    //   }
    //   res.json({ result: 'success', container_id: userContainers[container_index].id });
    // });
  });
  // res.json({ result: 'success' });
});

app.post("/api/start_container", (req, res) => {
  let run_arguments = ["start", req.body.id];
  console.log("docker " + run_arguments.join(" "));
  execFile("docker", run_arguments, (error, stdout, stderr) => {
    if (error) {
      console.log(stderr);
      return res.status(500).json({ result: "error", message: stderr });
    }

    res.json({ result: "success" });
  });
  // res.json({ result: 'success' });
});

app.post("/api/stop_container", (req, res) => {
  console.log("Stop request body: " + req.body);
  let run_arguments = ["stop", req.body.id];
  console.log("docker " + run_arguments.join(" "));
  execFile("docker", run_arguments, (error, stdout, stderr) => {
    if (error) {
      console.log(stderr);
      return res.status(500).json({ result: "error", message: stderr });
    }

    res.json({ result: "success" });
  });
  // res.json({ result: 'success' });
});

module.exports = app;
