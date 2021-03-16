const express = require("express");
const session = require("express-session");
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
app.use(express.json());
app.use(express.static("public"));

app.listen(
    PORT,
    () => console.log("App live and listening on port " + PORT)
);

var sess;

app.get("/", (req, res) => {
    res.render("index.html", { title: "GET " + req.originalUrl, body: "Hello World!" });
});

app.get("/sessions/:token", (req, res) => {

    const { token } = req.params;

    utils.selectFromDB(connection, function(success, resp) {
        if (success) {
            res.render("index.html", { title: token, body: JSON.stringify(resp[0]) });
        } else {
            res.status(404).render("404.html");
        }
    }, "sessions", "token", token);
});