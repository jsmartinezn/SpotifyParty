const express = require('express');
const router = express.Router();

const dotenv = require('dotenv').config();

const mu = require("../db/MongoUtils.js");

const SpotifyWebAPI = require('spotify-web-api-node');

var loggedIn = false;
var myemail = null;

const spotifyAPI = new SpotifyWebAPI({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});
const scopes = ["user-read-currently-playing", "user-read-playback-state", "user-modify-playback-state", "user-read-email"];
const authorizeSpotifyURL = "https://accounts.spotify.com/authorize";
const tokenSpotifyURL = "https://accounts.spotify.com/api/token";

//Login endpoint
router.get('/login', (req, res) => {
    console.log("Login received, redirecting to spotify");
    const url = spotifyAPI.createAuthorizeURL(scopes);
    res.redirect(url+"&show_dialog=true");
});

//Login callback endpoint
router.get("/logincallback/", async (req,res) => {
    console.log("LoginCallback received, getting code");
    console.log("code:", req.query.code);
    
    spotifyAPI.authorizationCodeGrant(req.query.code).then( data => {
        console.log('The token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);
        console.log('The refresh token is ' + data.body['refresh_token']);
        spotifyAPI.setAccessToken(data.body['access_token']);
        spotifyAPI.setRefreshToken(data.body['refresh_token']);
        loggedIn = true;
        res.redirect('/');
    }).catch(err => {console.log('error on Authorization Code Grant', err)});
    
});

// Update user endpoint
router.get('/getUser', (req,res) => {
    console.log("GetUser received");
    if(loggedIn === true){
        console.log("loggedIn, sending username");
        spotifyAPI.getMe()
        .then(data => {
            myemail=data.body.email;
            res.json(data.body.display_name);
        }).catch(err => {console.log('error getting user info from spotify')});
    }
    else{
        console.log("Not loggedIn, giving back null");
        res.json(null);
    }
});

router.get('/getplayback', (req, res) => {
    console.log("GetPlayback received");
    if(loggedIn === true)
    {
        console.log("loggedIn, sending playback info");
        spotifyAPI.getMyCurrentPlaybackState()
        .then(data => {
            if(data.body.item !== undefined)
            {
                console.log("Playback is: ", data.body.item.name);
            }
            res.json(data.body);
        });
    }
    else{
        console.log("Not loggedIn, giving back null");
        res.json(null);
    }
});

router.get('/next', (req,res) =>{
    console.log("Change to next song received");
    if(loggedIn === true)
    {
        console.log("loggedIn, fetching next song");
        spotifyAPI.skipToNext()
        .catch((err) => 
        {
            console.log(err);
            if(err.statusCode === 500)
            {
                console.log("Error from Spotify");
                res.json(null);
            }
            
        })
        .then((data) => {
            
            if(data.statusCode === 204)
            {
                console.log("Skipped to next");
                res.json("Next");
            }
            
            else{
                res.json(null);
            }
        })
    }
    else{
        console.log("Not loggedIn, giving back null");
        res.json(null);
    }
});

router.get('/previous', (req,res) =>{
    console.log("Change tp previous song received");
    if(loggedIn === true)
    {
        console.log("loggedIn, fetching previous song");
        spotifyAPI.skipToPrevious()
        .catch((err) => 
        {
            console.log(err);
            if(err.statusCode === 500)
            {
                console.log("Error from Spotify");
                res.json(null);
            }
            
        })
        .then(data => {
            if(data.statusCode === 204)
            {
                console.log("Skipped to previous");
                res.json("Previous");
            }
            else{
                res.json(null);
            }
        })
    }
    else{
        console.log("Not loggedIn, giving back null");
        res.json(null);
    }
});

router.get('/play', (req,res) =>{
    console.log("Play song received");
    if(loggedIn === true)
    {
        console.log("loggedIn, playing song");
        spotifyAPI.play()
        .then(() => {
            console.log("Playing");
            res.json("Play");
        })
    }
    else{
        console.log("Not loggedIn, giving back null");
        res.json(null);
    }
});

router.get('/pause', (req,res) =>{
    console.log("Pause playback received");
    if(loggedIn === true)
    {
        console.log("loggedIn, pausing playback");
        spotifyAPI.pause()
        .then(() => {
            console.log("Pausing");
            res.json("Pause");
        })
    }
    else{
        console.log("Not loggedIn, giving back null");
        res.json(null);
    }
});

router.get('/playdoowop', (req,res) =>{
    console.log("Doo wop received");
    if(loggedIn === true)
    {
        spotifyAPI.play({uris: ["spotify:track:17RcMFZHPrjusBlklhSKou"]})
        .then(() => {
            console.log("Doo Wop playing");
            res.redirect("/");
        }).catch(err => {console.log(err)});
        
    }
    else{
        console.log("Not loggedIn, giving back null");
        res.json(null);
    }
});

router.post('/gettracksinfo', (req, res) =>{
    console.log("Get track info received");
    if(loggedIn === true)
    {
        spotifyAPI.getTracks(req.body)
        .then((data) => {
            console.log("Got tracks in back:", data.body.tracks);
            res.json(data.body.tracks);
        });
    }
    else{
        console.log("Not loggedIn, giving back null");
        res.json(null);
    }
});

router.get('/refreshaccesstoken', (req,res) =>{
    console.log("Refreshing access token");
    if(loggedIn === true)
    {
        console.log("loggedIn, refreshing");
        spotifyAPI.refreshAccessToken()
        .then(data => {
            console.log('The old access token is ' + spotifyAPI.access_token);
            console.log('The refresh token is ' + spotifyAPI.refresh_token);
            spotifyAPI.setAccessToken(data.body['access_token']);
            console.log('The new access token is ' + data.body['access_token']);
            console.log("Refreshed");
            res.redirect("/");
        });
    }
    else{
        console.log("Not loggedIn, giving back null");
        res.json(null);
    }
});

router.get('/getallgroups', (req,res) =>{
    console.log("Getting group info...");
    if(loggedIn === true)
    {
        mu.getGroupsData(myemail)
        .then(arraydata =>{
            res.json(arraydata);
        });
    }
});


module.exports = router;