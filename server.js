// npm packages
var express = require("express");
var expressHandlebars = require("express-handlebars");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var request = require("request");
var cheerio = require("cheerio");


var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
    extended: false
}));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// By default mongoose uses callbacks for async queries, we're setting it to use promises (.then syntax) instead
// Connect to the Mongo DB
mongoose.Promise = Promise;
//NEED TO UPDATE THIS
mongoose.connect("mongodb://localhost/week18Populater", {
    useMongoClient: true
});
var db = mongoose.connection;

// Routes

// A GET route for scraping the google website
app.get("/scrape", function (req, res) {
            // First, we grab the body of the html with request
            request("https://news.google.com",
                function (error, response, html) {
                    // Then, we load that into cheerio and save it to $ for a shorthand selector
                    var $ = cheerio.load(html);

                    // Now, we grab every h2 within an article tag, and do the following:
                    //NEED TO UPDATE THIS
                    $("article h2").each(function (i, element) {
                        // Save an empty result object
                        var result = {};

                        // Add the text and href of every link, and save them as properties of the result object
                        result.title = $(this)
                            .children("a")
                            .text();
                        result.link = $(this)
                            .children("a")
                            .attr("href");
                        //ADD SUMMARY

                        // pass the result object to the entry and title and link 
                        var entry = new Article(result);

                        entry.save(function (err, doc) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(doc);
                            }
                        });
                    });

                    // If we were able to successfully scrape and save an Article, send a message to the client
                    res.send("Scrape Complete");
                });


            // Route for getting all Articles from the db
            app.get("/articles", function (req, res) {
                // TODO: Finish the route so it grabs all of the articles
                Article.find({}, function (error, doc) {
                    if (error) {
                        console.log(error);
                    } else {
                        res.json(doc);
                    }
                });
            });

            // Route for grabbing a specific Article by id, populate it with it's note
            app.get("/articles/:id", function (req, res) {
                // TODO
                // ====
                // Finish the route so it finds one article using the req.params.id,
                // and run the populate method with "note",
                // then responds with the article with the note included
                Article.findOne({
                        "_id": req.params.id
                    })
                    .populate("note")
                    .exec(function (error, doc) {
                        if (error) {
                            console.log(error);
                        } else {
                            res.json(doc);
                        }
                    });
            });

            // Route for saving/updating an Article's associated Note
            app.post("/articles/:id", function (req, res) {
                // TODO
                // ====
                // save the new note that gets posted to the Notes collection
                // then find an article from the req.params.id
                // and update it's "note" property with the _id of the new note
                var newNote = new Note(req.body);
                newNote.save(function(error, doc) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        Article.findOneAndUpdate({"_id": req.params.id}, {"note": doc._id})
                        .exec(function(err, doc) {
                            if (err){
                                console.log(err);
                            }
                            else{
                                res.send(doc);
                            }
                        });
                    }
                });
            });

            // Start the server
            app.listen(PORT, function () {
                console.log("App running on port " + PORT + "!");
            });