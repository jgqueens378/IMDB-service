const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require("url");
const path = require('path');

// API's: Watchmode & IMDb-API

const configPath = path.join(__dirname, 'credentials.json'); //joins the specified path segments into one path.

const config = JSON.parse(fs.readFileSync(configPath)); // read the contents of our json file (our API KEY) using .readfilesync, then parse data
// The JSON.parse will convert JSON string to JS object

// config. give use the value of property "API_KEY" in object config 
const API_KEY = config.API_KEY;
const API_KEY2 = config.API_KEY2;

const port = 3000;
const server = http.createServer();

server.on("listening", listen_handler);
server.listen(port);

function listen_handler() {
    console.log(`Now listening on port ${port}`);
}

server.on("request", request_handler);
function request_handler(req, res){
    console.log(req.url);
    if(req.url === "/"){ // path works now but how can i shorten it
        const file_path = path.join(__dirname, 'index.html');
        const main = fs.createReadStream(file_path);
        res.writeHead(200, {"Content-Type":"text/html"});
        main.pipe(res);
    }
    else if(req.url.startsWith("/search")){
        let {film} = url.parse(req.url,true).query;
        get_imdb_Id(film, res);
    }
    else{
        res.writeHead(404, {"Content-Type": "text/html"});
        res.end("<h1>Not Found</h1>");    
    }
}

function get_imdb_Id(film, res){
    const expression = film;
    console.log("API KEY is here:" );
    const search_endpoint = `https://imdb-api.com/API/SearchMovie/${API_KEY}/${expression}`;
    const search_request = https.get(search_endpoint, { headers: { 'Accept': 'application/json' }}); // server expects the response from the IMDb API to be in the JSON format.
    search_request.once("response", process_stream);

    // stream represents the stream of data coming from API request
    function process_stream(stream){
        let data = "";
        stream.on("data", chunk => data += chunk);
        stream.on("end", () => serve_idmb_details(data, res));
    }
}

// function serve_idmb_details(data, res) { // json string is passed containing details of movies that is similar to user input

//     let movie_object = JSON.parse(data); // data in the form of json string so convert it to object so we can manipulate;
//     let movie = movie_object && movie_object.results; // the array with movies and their parameters (id, title, description)
//     // we get array with movie titles that match and their descriptors

//     let first_movie_id = get_firstmovie_id(movie); // (2ND API CALL) function to get first movie id streaming services
//     console.log("first movie idmb ID: " + first_movie_id);

//     get_stream_sources(first_movie_id, res);
// }

function serve_idmb_details(data, res) { // json string is passed containing details of movies that is similar to user input

    let movie_object = JSON.parse(data); // data in the form of json string so convert it to object so we can manipulate;
    let movie = movie_object && movie_object.results; // the array with movies and their parameters (id, title, description)
    // we get array with movie titles that match and their descriptors

    let first_movie_id = get_firstmovie_id(movie); // (2ND API CALL) function to get first movie id streaming services
    console.log("first movie idmb ID: " + first_movie_id);

    get_stream_sources(first_movie_id, res);
}



function get_firstmovie_id(movie){ // pass in movie object (array of arrays)
    let first_id = movie[0].id; // the first object in array tends to be the movie user is speaking 
    return first_id;

}

function get_stream_sources(idmb_id, res){ // pass idmb_id, and response
    let title_id = idmb_id;
    const search_endpoint = `https://api.watchmode.com/v1/title/${title_id}/details/?apiKey=${API_KEY2}&append_to_response=sources`;
    const search_request = https.get(search_endpoint, { headers: { 'Accept': 'application/json' }});
    search_request.once("response", process_stream);

    function process_stream(stream){
        let data = "";
        stream.on("data", chunk => data += chunk);
        stream.on("end", () => serve_sources(data, res));
    }
}

function serve_sources(data, res){ // ** 2ND API CALL FOR STREAMS **
    let streams_object = JSON.parse(data); // data in the form of json string so convert it to object so we can manipulate;
    let streams_wm = streams_object && streams_object.sources; // array of array with stream sources under name
    let results = streams_wm.map(format_streams).join('');  

    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(`<h1>Movies:</h1><ul>${results}</ul>`);
}

function format_streams(streams_wm){
    let streams = streams_wm && streams_wm.name; // go to object.title part and extract it
    let id = streams_wm && streams_wm.source_id;
    // let description = movie && movie.description
    return `<li><h1> Movie: ${streams} </h1><p> Source ID: ${id}</p></li>`;
}
