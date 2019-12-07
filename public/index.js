'use strict'

function onSignIn(googleUser) {

    console.log("User signed in");
    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
    var id_token = googleUser.getAuthResponse().id_token;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:8080/tokensignin');
    xhr.onload = function() {
        let body = document.getElementsByTagName('body')
        let res = JSON.parse(xhr.response);
        console.log(res);
        if(res.authStatus === false){
            let auth_link = document.createElement('a')
            auth_link.id = "auth-btn"
            auth_link.className = 'center'
            auth_link.href = res.oauth_uri
            auth_link.innerText = 'Authorize Google'
            body[0].appendChild(auth_link);
        }
        else{
            let msg = document.createElement('p')
            msg.className = 'center'
            msg.innerText = res.msg
            body[0].appendChild(msg);
        }
    };
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send('idtoken=' + id_token);
}