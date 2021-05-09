const apiEndpoint = "https://expressjs-project.herokuapp.com:" + getCookie("port") + "/";

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

        fetch(apiEndpoint + getSubdomain(event.target.action), {
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

function getRootHost(url) {
    return url.split("/").slice(0, 3).join("/");
}

function getSubdomain(url) {
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