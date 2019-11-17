let mongoose = require('mongoose');
const uuid = require('uuidv4').default;

mongoose.Promise = global.Promise;

// BlogPost SCHEMA and API definition.
let BlogPostSchema = mongoose.Schema({
	title : { type : String },
    content : { type : String },
    author: { type : String },
    publishedDate: { type : String },
    id: {
        type: String,
        required: true
    }
});

let BlogPost = mongoose.model( 'BlogPost', BlogPostSchema );
let BlogPostList = {
	get : function(){
		return BlogPost.find()
				.then( BlogPosts => {
					return BlogPosts;
				})
				.catch( error => {
					throw Error(error);
				});
	},
	post : function( newBlogPost ){
        console.log(newBlogPost);
		newBlogPost.id = uuid()
		return BlogPost.create(newBlogPost)
				.then(BlogPost => {
					return BlogPost;
				})
				.catch( error => {
					console.log(newBlogPost, error);
					throw Error(error);
				});
	},
	get_by_id: function( id ) {
		return BlogPost.findOne({id: id})
					.then(BlogPost=> {
						return BlogPost;
					})
					.catch( error => {
						throw Error(error);
					});
	},
	put: function( id, newValue ) {
        console.log(newValue);
		return BlogPost.findOneAndUpdate({id: id}, {$set: newValue}, {new: true})
					.then(BlogPost=> {
						return BlogPost;
					})
					.catch( error => {
						throw Error(error);
					});
	},
	delete: function(id) {
		return BlogPost.findOneAndRemove({id: id})
					.then(BlogPost => {
						return BlogPost;
					})
					.catch( error => {
						throw new Error(error);
					});
	}
}

module.exports = { BlogPostList };