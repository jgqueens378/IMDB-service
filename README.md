# Description
The goal is to have the user input a film/show in the box description & then return the streaming services it's found on. 
The HTTP server is created & set to listen on port 3000. When a request is received we extract the movie title from its parameters. After,
we use the title to make a request in the IMDB-api that'll return the ID for the movie/show. With the IMDB-ID, server makes a request to the watchmode-api 
to get the streaming services of the film, along with some other info. The api returns the data for the movie and the server formats the info into a HTML response.
In the end the user receives an HTML page the has the streaming services as well as some additional info about the film.
