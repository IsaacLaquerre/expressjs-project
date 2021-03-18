const express = require("express");
const session = require("express-session");
const cookies = require("cookies");
const mysql = require("mysql");
const utils = require("./utils.js");

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'expressjsproject',
    flags: "-FOUND_ROWS"
});

connection.connect(function(err) {
    if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return;
    }

    console.log('Connected to database as id ' + connection.threadId);
});

var app = express();
var router = express.Router();

const PORT = 8080;

app.use(session({ secret: "admin", saveUninitialized: true, resave: true }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(session({ secret: "test", saveUninitialized: true, resave: true }));

app.listen(
    PORT,
    () => console.log("App live and listening on port " + PORT)
);

var sess;

app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "public/views" });
});

app.get("/login", (req, res) => {
    return res.sendFile("login.html", { root: "public/views" });
});

app.post("/login", (req, res) => {
    const body = req.body;
    utils.existsInTable(connection, "sessions", "email", body.email, function(exists) {
        if (!exists) {
            return res.send({
                status: "error",
                error: "E-mail or password is incorrect"
            });
        } else {
            return res.send({
                status: "ok",
                redirect: "../"
            });
        }
    });
});

app.get("/sessions/new", (req, res) => {
    res.sendFile("createAccount.html", { root: "public/views" });
});

app.post("/sessions/new", (req, res) => {
    const body = req.body;
    utils.existsInTable(connection, "sessions", "email", body.email, function(exists) {
        if (exists) {
            return res.send({
                status: "error",
                error: "An account with this e-mail already exists"
            });
        } else {
            utils.insertToDB(connection, "sessions", ["username", "email", "password", "ip"], [body.username, body.email, body.password, body.ip], function() {
                return res.send({
                    status: "ok",
                    redirect: "../"
                });
            });
        }
    });
});

app.get("/sessions/:token", (req, res) => {

    const { token } = req.params;
    const query = req.query;

    if (req.query.exists != undefined) {
        utils.existsInTable(connection, "sessions", "token", token, function(exists) {
            if (exists) {
                var result = {
                    status: "ok",
                    exists: true
                };
            } else {
                var result = {
                    status: "ok",
                    exists: false
                };
            }
            return res.send({ result });
        });
    }

    utils.selectFromDB(connection, function(success, resp) {
        if (success) {
            return res.send({
                status: "ok",
                data: resp[0]
            });
        } else {
            return res.status(404).sendFile("404.html", { root: "public/views" });
        }
    }, "sessions", "token", token);
});

app.get("*", (req, res) => {
    return res.status(404).sendFile("404.html", { root: "public/views" });
});