const usersCollection = require('../db').db().collection("users")
const followsCollection = require('../db').db().collection("follows")
const ObjectId = require('mongodb').ObjectId


let Follow =  function (followedUsername, authorId) {
    this.followedUsername = followedUsername
    this.authorId = authorId
    this.errors= []
}



//if (typeof(this.followedUsername) != "string") helyett ROSSZUL ezt irtam: if (typeof(this.followedUsername != "string"))  

//hihetetlen, de itt egy zarojelet elirtam, es a program lefutott node altal visszajekzett hiba nelkul, ami nem jo hogy lefut, mert a 
//a program mukodese nem volt jo vegul, mert a zarojel leirasa miatt a this.followedUsername = "" lett mindig 
//azaza  hiaba kovetem egy masik usert az nem mukododd jol, mindig "You cannot  follow a user that dooes not exist" else ág futott le 
//a zarojelre ott jottem ra, hogy letoltottem az eredeti forras filet- es egyenkent megneztem benne a functionokat (-:) 
Follow.prototype.cleanUp = function () {
    if (typeof(this.followedUsername) != "string") {this.followedUsername = "" }
    //console.log(typeof(this.followedUsername != "string"))
}

Follow.prototype.validate = async function (action) {
    //so followedUsername must be exist in database
    let followedAccount = await usersCollection.findOne({username: this.followedUsername})
    if (followedAccount){ 
        this.followedId = followedAccount._id
    }
    else { 
        this.errors.push("You cannot  follow a user that dooes not exist")
    }
    //to make sure not double follow or double delete 
    let doesFollowAlreadyExist = await followsCollection.findOne({followedId:this.followedId, authorId: new ObjectId(this.authorId)})
    if (action == "create"){
        if(doesFollowAlreadyExist){this.errors.push("You already follow this user")}
    }
    if (action == "delete"){
        if(!doesFollowAlreadyExist){this.errors.push("You cannot  stop following someone you do not already follow")}
    }
    //to make sure not to able to follow yourself

    if (this.followedId.equals(this.authorId)){this.errors.push("You can not follow yourself.")}


}

Follow.prototype.create = function () {
    return new Promise (async (resolve,reject)=>{
        this.cleanUp()
        await this.validate("create")
        if (!this.errors.length){
            await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
            resolve()
        } else {
            reject(this.errors)
        }

    })
}


Follow.prototype.delete = function () {
    return new Promise (async (resolve,reject)=>{
        this.cleanUp()
        await this.validate("delete")
        if (!this.errors.length){
            await followsCollection.deleteOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
            resolve()
        } else {
            reject(this.errors)
        }

    })
}


Follow.isVisitorFollowing = async function (followedId, visitorId) {
    let folldDoc = await followsCollection.findOne({followedId:followedId, authorId: new ObjectId(visitorId)})
    if (folldDoc) {
        return true 
    } 
    else {
        return false
    }
    
}


module.exports = Follow