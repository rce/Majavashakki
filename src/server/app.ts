import * as http from "http";
import {resolve} from "path";

import * as express from "express";
import * as passport from "passport";
import {Strategy} from "passport-facebook";
import * as sio from "socket.io";
import {MongooseClient} from "./data/MongooseClient";
import {User} from "./data/User";

import {Game} from "./entities/GameRoom";
import {GameRoomsRepository} from "./logic/GameRoomsRepository";
import {UserStatesRepository} from "./logic/UserStatesRepository";
import {enableSessions, getSession} from "./session";
import {copy} from "../common/util";
const siteName = process.env.WEBSITE_SITE_NAME; // Azure default
const appRootUrl = siteName ? `https://${siteName}.azurewebsites.net` : "http://localhost:3000";
MongooseClient.InitMongoConnection();
const app = express();
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
  new Strategy({
    clientID: process.env.MajavashakkiFbClientId,
    clientSecret: process.env.MajavashakkiFbSecret,
    callbackURL: appRootUrl + "/login",
  },
  (accessToken, refreshToken, profile, done) => {
    console.log(`User '${profile.displayName}' logged in successfully.`);
    User.findOrCreate(profile.id, (err, user) => {
      console.log("ERNO: " + err);
      process.nextTick(() => done(err, user));
    });
  },
));

const io: SocketIO.Server = sio({transports: ["websocket"]});
enableSessions(app, io);

const logSession = (path, session) => {
  const withoutCookie = copy(session);
  delete withoutCookie.cookie;
  console.log(`[${session.id}] ${path} ${JSON.stringify(withoutCookie)}`);
};

app.use((req, res, next) => {
  logSession(req.path, getSession(req));
  next();
});
// Mitä nää tekee? :)
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  initSockets();
  return next();
});

app.get("/login",
  passport.authenticate("facebook", { failureRedirect: "/error" }),
  (req, res) => { // Successful authentication, redirect home.
    res.redirect("/");
});

const server = http.createServer(app);
io.attach(server);

app.use(express.static(resolve("dist/public")));

const roomRepo = GameRoomsRepository.getInstance();
const userStateRepo = UserStatesRepository.getInstance();

function initSockets() {
  io.on("connection", (socket: SocketIO.Socket) => {
    logSession("/socket.io", getSession(socket));

    socket.on("new user", (username: string) => {
      userStateRepo.createUser(username, socket, roomRepo.MainRoom);
    });

    socket.on("fetch-games", () => {
      socket.emit("update-games", roomRepo.getAvailableGames());
    });

    socket.on("create-game", (title: string) => {
      roomRepo.createRoom(title, userStateRepo.getState(socket.id));
    });

    socket.on("join-game", (roomTitle) => {
      roomRepo.joinRoom(roomTitle, userStateRepo.getState(socket.id));
    });

    socket.on("move", (data) => {
      const game = roomRepo.getGameRoom(userStateRepo.getState(socket.id).currentRoom);
      const result = game.move(data.from, data.dest);
      roomRepo.saveGame(game);

      switch (result.kind) {
      case "error":
          return socket.emit("move_result", result);
      case "success":
          return io.to(game.title).emit("move_result", result);
      }
    });
  });
}

export const start = port => {
  server.listen(port, () => {
    console.log("Server listening at port %d", port);
  });
  return server;
};
