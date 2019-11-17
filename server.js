let express = require("express");
let morgan = require("morgan");
let uuidv4 = require('uuid/v4');
let bodyParser = require('body-parser');
const cors = require('cors');

let { BlogPostList } = require('./blog-post-model');
const {DATABASE_URL, PORT} = require('./config');

let app = express();
let jsonParser = bodyParser.json();
let mongoose = require('mongoose');
mongoose.Promise = global.Promise;

app.use(morgan("dev"));
app.use(cors());

app.use( express.static( "public" ) );

let blogPostFields = [
    "title", "content", "author", "publishedDate"
]

app.get("/blog-posts", (req, res, next) => {
    BlogPostList.get()
		.then( blogposts => {
            console.log(blogposts);
			return res.status( 200 ).json( blogposts );
		})
		.catch( error => {
			res.statusMessage = "Something went wrong with the DB. Try again later.";
			return res.status( 500 ).json({
				status : 500,
				message : "Something went wrong with the DB. Try again later."
			})
		});
});

app.get("/blog-post", (req, res, next) => {
    if (req.query["author"] !== undefined) {
        let author = req.query["author"];
        
        BlogPostList.getByAuthor(author)
            .then( blogposts => {
                return res.status( 200 ).json( blogposts );
            })
            .catch( error => {
                res.statusMessage = "Something went wrong with the DB. Try again later.";
                return res.status( 500 ).json({
                    status : 500,
                    message : "Something went wrong with the DB. Try again later."
                })
            });
    } else {
        res.status(406).json({message: "No author specified.",
                              status: "406"});
    }
});

// Expecting data in body.
app.post("/blog-posts", jsonParser, (req, res) => {
    console.log(req.body);
    var jsonObject = req.body;
    var validObject = true;
    var missingFields = [];

    blogPostFields.forEach(function(field) {
        if (jsonObject[field] === undefined) {
            validObject = false;
            missingFields.push(field);
        }
    });
    console.log(missingFields);

    if (validObject) {
        jsonObject["id"] = uuidv4();
        
        BlogPostList.post(jsonObject)
            .then( blogpost => {
                return res.status( 201 ).json({
                    message : "BlogPost added to the list",
                    status : 201,
                    blogpost : blogpost
                });
            })
            .catch( error => {
                res.statusMessage = "Something went wrong with the DB. Try again later.";
                return res.status( 500 ).json({
                    status : 500,
                    message : "Something went wrong with the DB. Try again later.",
                    err: error
                })
            });
    } else {
        res.status(406).json(missingFields);
    }
});

app.delete("/blog-posts/:id", (req, res) => {
    
    let id = req.params.id;

	if ( !id ){
		res.statusMessage = "Missing 'id' field in params!";
		return res.status( 406 ).json({
			message : "Missing 'id' field in params!",
			status : 406
		});
	}

	BlogPostList.delete(id)
		.then( blogpost => {
			return res.status( 200 ).json( blogpost );
		})
		.catch( error => {
			res.statusMessage = "Something went wrong with the DB. Try again later.";
			return res.status( 500 ).json({
				status : 500,
				message : "Something went wrong with the DB. Try again later."
			})
		});
});

app.put("/blog-posts/:id", jsonParser, (req, res) => {
    let post_id = req.params.id;
    if (!post_id || !(req.body["id"])) {
        res.status(406).json({message: "ID missing in request body",
                                status: "406"});
    } else {
        if (req.params.id != req.body.id) {
            res.status(409).json({message: "Request body and path id variables do not match.",
                                status: "409"});
        } else {
            console.log(post_id);
            console.log(req.body.newValue);
            BlogPostList.put(post_id, req.body.newValue)
                .then( blogpost => {
                    return res.status( 201 ).json({
                        message : "BlogPost added to the list",
                        status : 201,
                        blogpost : blogpost
                    });
                })
                .catch( error => {
                    res.statusMessage = "Something went wrong with the DB. Try again later.";
                    return res.status( 500 ).json({
                        status : 500,
                        message : "Something went wrong with the DB. Try again later.",
                        err: error
                    })
                });
        }
    }
});

let server;

function runServer(port, databaseUrl){
	return new Promise( (resolve, reject ) => {
		mongoose.connect(databaseUrl, response => {
			if ( response ){
				return reject(response);
			}
			else{
				server = app.listen(port, () => {
					console.log( "App is running on port " + port );
					resolve();
				})
				.on( 'error', err => {
					mongoose.disconnect();
					return reject(err);
				})
			}
		});
	});
}

function closeServer(){
	return mongoose.disconnect()
		.then(() => {
			return new Promise((resolve, reject) => {
				console.log('Closing the server');
				server.close( err => {
					if (err){
						return reject(err);
					}
					else{
						resolve();
					}
				});
			});
		});
}

runServer( PORT, DATABASE_URL )
	.catch( err => {
		console.log( err );
	});

module.exports = { app, runServer, closeServer };