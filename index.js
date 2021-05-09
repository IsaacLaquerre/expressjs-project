const express = require("express");
const session = require("express-session");
const cookies = require("cookies");
const mysql = require("mysql");
const hash = require('password-hash');
const config = require(__dirname + "/config.json");
const utils = require(__dirname + "/utils.js");

var connection = mysql.createConnection({
    host: "us-cdbr-east-03.cleardb.com",
    user: process.env.dbUser || config.dbUser,
    password: process.env.dbPass || config.dbPass,
    database: process.env.dbName || config.dbName,
    flags: process.env.dbFlags || config.dbFlags
});

connection.connect(async function(err) {
    if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return;
    }

    console.log('Connected to database as id ' + connection.threadId);

    console.log("Setuping tables...");

    var tables = {
        tableName: ["sessions", "posts"],
        tableValues: [["token VARCHAR(32)", "username VARCHAR(32)", "email VARCHAR(32)", "password VARCHAR(64)", "ip VARCHAR(24)"], ["title VARCHAR(32)", "body VARCHAR(254)", "author VARCHAR(32)", "date DATETIME"]]
    } //Add tables you want to auto-setup
    for (i in tables.tableName) {
        await utils.setupDB(connection, tables.tableName[i], tables.tableValues[i]);
    }
});

var app = express();
app.use(express.static(__dirname + '/public'));

const PORT = process.env.PORT || 3000;

app.use(session({ secret: process.env.secret || config.secret, saveUninitialized: true, resave: true }));
app.use(express.json());
app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.listen(
    PORT,
    () => console.log("App live and listening on port " + PORT)
);

var sess;

app.get("/", (req, res) => {
    return res.sendFile("index.html", { root: "public/views" });
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
            utils.selectFromDB(connection, function(success, resp) {
                if (success) {
                    if (hash.verify(body.password, resp[0].password)) {
                        var token = utils.createToken(32);
                        res.cookie("token", token);
                        utils.updateDB(connection, "sessions", "token", token, ["email", body.email], function(resp, err) {
                            if (err) {
                                return res.send({
                                    status: "error",
                                    error: "Internal server error: Couldn't update session token, please try again in a few minutes"
                                });
                            }else {     
                                return res.send({
                                    status: "ok",
                                    redirect: "../"
                                });
                            }
                        });
                    }else {
                        return res.send({
                            status: "error",
                            error: "E-mail or password is incorrect"
                        });
                    }
                }else {
                    return res.send({
                        status: "error",
                        error: "E-mail or password is incorrect"
                    });
                }
            }, "sessions", "password");
        }
    });
});

app.get("/sessions/new", (req, res) => {
    return res.sendFile("createAccount.html", { root: "public/views" });
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
            var token = utils.generateToken();
            res.cookie("token", token);
            console.log(hash.generate(body.password));
            utils.insertToDB(connection, "sessions", ["token", "username", "email", "password", "ip"], [token, body.username, body.email, hash.generate(body.password), body.ip], function() {
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