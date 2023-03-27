const postsCollection = require('../db').db().collection("posts")
const ObjectId = require('mongodb').ObjectId
const User = require('./User')
const sanitizeHTML = require('sanitize-html')
//Post blueprint for posts(aka ''CLASS)
let Post = function (data, userid, requestedPostId) {
    this.data = data
    this.errors = []
    this.userid = userid
    this.requestedPostId = requestedPostId
}
//Post blueprint methods for posts, methods (aka ''CLASS methods )
Post.prototype.cleanUp = function(){
    if (typeof(this.data.title)!="string"){this.data.title = ""}
    if (typeof(this.data.body)!="string"){this.data.body = ""}
    //get rid of any bogus property
    this.data = {
        title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
        createdDate : new Date(),
        author: new ObjectId(this.userid)
    }
}
Post.prototype.validate = function(){
    if (this.data.title =="") {this.errors.push("You must provide a title")}
    if (this.data.body =="") {this.errors.push("You must provide post content")}
}
Post.prototype.create = function(){   
    return new Promise ((resolve, reject)=>{ // outer Promise 
        this.cleanUp()
        this.validate()
        if(!this.errors.length){
            
            //save post in to datebase
            //inner Promise 
            postsCollection.insertOne(this.data).then((info)=>{ //inner Promise 
                resolve(info.insertedId) // outer Promise Resolve 
            }).catch(()=>{
                this.errors.push("Please try again later")
                reject(this.errors) // outer Promise Reject1
            })
        } else {
            reject(this.errors) // outer Promise Reject2
        }
    })
}
Post.prototype.update = function(){
    return new Promise (async(resolve, reject)=>{
        try {
            let post = await Post.findSingleById(this.requestedPostId, this.userid)
            if (post.isVisitorOwner) {
                //actually update the db
                let status = await this.actuallyUpdate()
                resolve(status)
            } else{
                reject()
            }
        } catch {
            reject()
        }
    })
}
Post.prototype.actuallyUpdate = function (){
    return new Promise(async(resolve, reject)=>{
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            await postsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedPostId)}, {$set: {title : this.data.title, body: this.data.body}})
            resolve("success")
        } else {
             resolve ("failure")
        }
    })
}
Post.reusablePostQuery = function(uniqueOperations, visitorId, finalOperations =[]){
    return new Promise(async function(resolve, reject){
        // uniqueOperations will be as param overgiven : 
        
        // [{$match: {_id: new ObjectId(id)}}]                           OR
        // [{$match: {author: authorId}},{$sort: {createdDate: -1}}]
        
        let aggOperations = uniqueOperations.concat([
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
            //this filter the resulting posts[0] object:  
            {$project: {
                title:1,
                body:1,
                createdDate:1,
                authorId:  "$author",
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ]).concat(finalOperations)

        let posts = await postsCollection.aggregate(aggOperations).toArray()
        
        posts =posts.map(function(post){
            post.isVisitorOwner = post.authorId.equals(visitorId)

            //not to expose the authorId  from datebase to search function in frontend 
            
            post.authorId = undefined 
            
            //clean the "new author  property (id > no need,    name , email,    pass>>>no need ) in the result post (id, title, body, AUTHOR) object"
            //overwrite the post object AUTHOR propery with only 2 properties : name+ email (avatar)
            post.author ={
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })
        resolve(posts)
    })
}
Post.findSingleById = function(id, visitorId){
    return new Promise(async function(resolve, reject){
        if(typeof(id)!="string" || !ObjectId.isValid(id)){
            reject()
            return
        }
        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectId(id)}}
        ], visitorId)

        if(posts.length){
           resolve(posts[0])
        } else {
            reject()
        }
    })
}
Post.findByAuthorId = function(authorId){
    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}}
    ])
} 
Post.delete = function (postIdToDelete, currentuserId) {

    return new Promise(async (resolve, reject) => {
        
        try {
          let post = await Post.findSingleById(postIdToDelete, currentuserId)
          if (post.isVisitorOwner) {
            await postsCollection.deleteOne({_id: new ObjectId(postIdToDelete)})
            resolve()
          } else {
            reject()
          }   
        } catch {
          reject() 
        } 
    })   
}


Post.search = function(searchTerm){
    return new Promise(async(resolve, reject)=>{
        if (typeof(searchTerm) == "string") {
            let posts = await Post.reusablePostQuery([
                {$match: {$text: {$search: searchTerm}}}
                

            ],undefined, [{$sort: {score: {$meta: "textScore"}}}])
            resolve(posts)            
        } else {
            reject()
        }
    })
}

module.exports = Post