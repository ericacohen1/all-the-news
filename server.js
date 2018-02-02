// npm packages
var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var request = require("request");
var cheerio = require("cheerio");
var path = require("path");


// Require all models
var models = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
    extended: false
}));
// Use express.static to serve the public folder as a static directory
app.use(express.static(path.join(__dirname, "public")));

// By default mongoose uses callbacks for async queries, we're setting it to use promises (.then syntax) instead
// Connect to the Mongo DB
// mongoose.Promise = Promise;

if(process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI);
} else {
    mongoose.connect("mongodb://localhost/project")
}
// Routes

app.get("/", function(req, res) {
    models.Article.find({})
    .populate("note")
    .exec(function (error, doc) {
        if (error) {
            console.log(error);
            res.send("error");
        } else {
            console.log(doc);
            var hbsObject = {
                articles: doc,
            }
            res.render("index", hbsObject);
        }
    });
});

// A GET route for scraping the google website
app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with request
    request("https://www.reddit.com/r/UCDavis/",
        function (error, response, html) {
            // Then, we load that into cheerio and save it to $ for a shorthand selector
            var $ = cheerio.load(html);
            var scrapeResults = [];
            // Now, we grab every title within a p tag, and do the following:
            $("p.title").each(function (index, item) {
                // Save an empty result object
                var result = {};
                //console.log(item);
                // Add the text and href of every link, and save them as properties of the result object
                result.title = $(item)
                    .children("a")
                    .text();
                result.link = $(item)
                    .children("a")
                    .attr("href");
                //ADD SUMMARY

                //scrapeResults.push(result);

                // console.log(scrapeResults);
                // pass the result object to the entry and title and link 
                var entry = new models.Article(result);

                entry.save(function (err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(doc);
                    }
                    // If we were able to successfully scrape and save an Article, send a message to the client
                    
                });
                
            });
            res.send("Scrape Complete");
        });

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
    var newNote = new Note(req.body);
    newNote.save(function (error, doc) {
        if (error) {
            console.log(error);
        } else {
            Article.findOneAndUpdate({
                    "_id": req.params.id
                }, {
                    "note": doc._id
                })
                .exec(function (err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.send(doc);
                    }
                });
        }
    });
});

app.delete("/delete/:id", function (req, res) {
    var id = req.params.id.toString();
    Note.remove({
        "_id": id
    })
    .exec(function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log("Note has been deleted");
            res.send("Note has been deleted");
        }
    })
})

// app.get("/", function(req,res) {
//     res.render("index");
// });

// app.get("*", function(req,res) {
//     res.send("this page doesn't exist");
// });

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});