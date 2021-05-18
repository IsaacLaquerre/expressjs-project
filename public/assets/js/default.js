const apiEndpoint = "http://expressjs-project.herokuapp.com/";

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "null";
}

function isLoggedIn(callback) {
    if (getCookie("token") === "null") callback(false);
    fetch(apiEndpoint + "sessions/" + getCookie("token") + "?exists").then((body) => {
        body.json().then((res) => {
            if (res.exists) callback(true);
            else callback(false);
        });
    });
}

function handleSubmit(event) {
    event.preventDefault();

    const data = new FormData(event.target);

    const value = Object.fromEntries(data.entries());

    fetch("https://api.ipify.org/?format=json").then(body => body.json()).then(res => {
        value.ip = res.ip;
        if (event.target.id === "createPostForm") {
            value.accountToken = getCookie("token");
        }

        console.log(apiEndpoint + getPath(event.target.action));

        fetch(apiEndpoint + getPath(event.target.action), {
            method: "POST",
            body: JSON.stringify(value),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }).then(body => body.json()).then(res => {
            if (res.status === "ok") window.location.href = res.redirect;
            else {
                var errorDiv = document.createElement("DIV");
                errorDiv.classList.add("center");
                errorDiv.style.margin = "auto 40% auto 40%";
                errorDiv.style.backgroundColor = "#ffcccc";
                errorDiv.style.border = "2px solid #ff3333";
                errorDiv.style.width = "50%;";
                errorDiv.id = "error";
                var errorSpan = document.createElement("SPAN");
                errorSpan.classList.add("center");
                errorSpan.style.margin = "50% 10px 10px 10px;";
                errorSpan.innerHTML = res.error;
                errorDiv.appendChild(errorSpan);
                if (!document.getElementById("error")) document.querySelector("body").appendChild(errorDiv);
            }
        });
    });
}

function loadPosts() {

    fetch(apiEndpoint + "sessions/" + getCookie("token")).then(body => body.json()).then(res => {
        var currentUser = res.data.username;

        fetch(apiEndpoint + "posts/list").then(body => body.json()).then(res => {
            for (i in res.resp) {
                //Create post body
                postDiv = document.createElement("DIV");
                postDiv.id = res.resp[0].id;
                postDiv.style.width = "500px";
                postDiv.style.height = "200px";
                postDiv.style.border = "1px solid black";
                postDiv.style.position = "relative";
    
                //Create title span tag
                titleDiv = document.createElement("DIV");
                titleDiv.style.position = "absolute";
                titleDiv.style.top = "5px";
                titleDiv.style.left = "1rem";
                titleSpan = document.createElement("SPAN");
                titleSpan.style.fontSize = "18pt";
                titleSpan.style.dontWeight = "bold";
                titleSpan.innerHTML = res.resp[i].title;
                titleDiv.appendChild(titleSpan);
                postDiv.appendChild(titleDiv);
    
                //Create body textbox and span tag
                bodyDiv = document.createElement("DIV");
                bodyDiv.style.paddingTop = "3rem";
                bodyDiv.style.paddingLeft = "1rem";
                bodyDiv.style.wordWrap = "break-word";
                bodySpan = document.createElement("SPAN");
                bodySpan.style.fontSize = "12pt";
                bodySpan.innerHTML = res.resp[i].body;
                bodyDiv.appendChild(bodySpan);
    
                //Create author and date span tag
                authorDateSpan = document.createElement("SPAN");
                authorDateSpan.style.fontSize = "10pt";
                authorDateSpan.style.color = "rgb(100, 100, 100)";
                authorDateSpan.style.position = "absolute";
                authorDateSpan.style.bottom = "5px";
                authorDateSpan.style.left = "10px";
                authorDateSpan.innerHTML = "By " + res.resp[i].author + " - " + res.resp[i].date.split("T").join(" ").substring(0, 19);;
                bodyDiv.appendChild(authorDateSpan);
    
                if (currentUser === res.resp[i].author) {
                    deleteDiv = document.createElement("DIV");
                    deleteDiv.onclick = "deletePost(this.parentNode.parentNode.id)";
                    deleteDiv.style.position = "absolute";
                    deleteDiv.style.bottom = "5px";
                    deleteDiv.style.right = "10px";
                    deleteDiv.style.borderRadius = "5px";
                    deleteDiv.style.backgroundColor = "red";
                    deleteDiv.style.border = "1px solid darkred";
                    deleteDiv.style.textAlign = "center";
                    deleteDiv.style.padding = "10px;";
                    deleteDiv.style.cursor = "pointer";
                    deleteDiv.style.width = "50px;"
                    deleteDiv.style.height = "25px;"
                    deleteDiv.style.color = "white";
                    deleteSpan = document.createElement("SPAN");
                    deleteSpan.fontSize = "8pt";
                    deleteSpan.innerHTML = "Delete";
                    deleteDiv.appendChild(deleteSpan);
                    bodyDiv.appendChild(deleteDiv);
                }
    
                //Add body textbox to post body
                postDiv.appendChild(bodyDiv);
    
                //Add post to body of document
                document.getElementsByTagName("body")[0].appendChild(postDiv);
                document.getElementsByTagName("body")[0].appendChild(document.createElement("BR"));
            }
        });
    });
}

function deletePost(id) {
    console.log(id)
    var postID = id
    fetch(apiEndpoint + "posts/" + postID, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        }
    }).then(body => body.json()).then(res => {
        console.log(res);
    });
}

function getRootHost(url) {
    return url.split("/").slice(0, 3).join("/");
}

function getPath(url) {
    return url.split("/").slice(3).join("/");
}

function htmlDecode(input) {
    var e = document.createElement('div');
    e.innerHTML = input;
    return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

function showHidePassword() {
    var x = document.getElementById("password");
    if (x.type === "password") {
        x.type = "text";
        document.getElementById("show").style.display = "inline-block";
        document.getElementById("hide").style.display = "none";
        document.getElementById("showHidePassword").title = "Hide password"
    } else {
        x.type = "password";
        document.getElementById("hide").style.display = "inline-block";
        document.getElementById("show").style.display = "none";
        document.getElementById("showHidePassword").title = "Show password"
    }
}
