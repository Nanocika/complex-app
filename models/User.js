const bcrypt = require('bcryptjs')
const usersCollection = require('../db').db().collection("users")
const validator = require('validator')
const md5 = require('md5')
let User = function(data, getAvatar){
    this.data = data
    this.errors =[] 
    if(getAvatar==undefined){getAvatar = false}
    if(getAvatar){this.getAvatar()}
}
User.prototype.cleanUp = function(){
    if (typeof(this.data.username) != "string"){this.data.username =""}
    if (typeof(this.data.email) != "string"){this.data.email =""}
    if (typeof(this.data.password) != "string"){this.data.password =""}
    //get rid of any bogus properties
    this.data = {
      username : this.data.username.trim().toLowerCase(),
      email : this.data.email.trim().toLowerCase(),
      password : this.data.password
    }
}
User.prototype.validate = function(){
  return new Promise(async (resolve, reject)=>{
    if (this.data.username =="") {this.errors.push("You must provide a username")} 
    if (this.data.username !=="" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contains letters und numbers ")}
    if (!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email adress")} 
    if (this.data.password =="") {this.errors.push("You must provide a password")}
    if (this.data.password.length > 0 && this.data.password.length <12) {this.errors.push("Password must be at least 12 characters")} 
    if (this.data.password.length > 50 ) {this.errors.push("Password can not exceed 50 characters ")}
    if (this.data.username.length > 0 && this.data.username.length <3) {this.errors.push("Username must be at least 3 characters")} 
    if (this.data.username.length > 30 ) {this.errors.push("Username can not exceed 30 characters ")}
    //Only if username is valid then check to see if it's already taken 
    if (this.data.username.length> 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)){
      let usernameExist = await usersCollection.findOne({username:this.data.username})
      if (usernameExist){this.errors.push("That username is alreaday taken")}
    }
    //Only if email  is valid then check to see if it's already taken 
    if (validator.isEmail(this.data.email)){
      let emailExist = await usersCollection.findOne({email:this.data.email})
      if (emailExist){this.errors.push("That email is alreaday taken")}
    }
    resolve()
  }) 
}
User.prototype.login = function () {
  //outer Promise
  return new Promise((resolve, reject)=>{
        this.cleanUp()    
        
        //inner Promise
        usersCollection.findOne({username: this.data.username}).then((attemptedUser)=>{
          if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
            console.log("login - password is OK")
            this.data = attemptedUser
            this.getAvatar()
            resolve("Congrats") // outer Promise Resolve
          }else {
             reject("Invalid name / password") // outer Promise REject1
          }
        }).catch(function(){
             reject("Please try later")  //outer Promise REject2
        })//inner Promise 
  
  })//outer Promise
}
User.prototype.register = function(){
  return new Promise(async (resolve, reject)=> {//Promise 
      this.cleanUp()
      await this.validate()
      if (!this.errors.length){
      let salt = bcrypt.genSaltSync(10)
      this.data.password = bcrypt.hashSync(this.data.password, salt)
      await usersCollection.insertOne(this.data)
      this.getAvatar()
      resolve() //Promise Resolve
    } else {
      reject(this.errors) //Promise Reject
    }
  }) 
}
User.prototype.getAvatar = function(){
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}
User.findByUserName = function(username){
  return new Promise (function (resolve, reject) {// outer Promise
    if (typeof(username) != "string"){  
      reject()
      return
    }
    //inner Promise 
    usersCollection.findOne({username: username }).then(function (userDoc){
      if (userDoc) {
        userDoc = new User(userDoc, true) 
        userDoc ={
          _id: userDoc.data._id,
          username: userDoc.data.username,
          avatar: userDoc.avatar

        }
        resolve(userDoc)//inner Promise Resolve
      } else {
        reject() //inner Promise Reject
      }

    }).catch(function (){
      reject() ////outer Promise Reject1
    })
  })
}
module.exports = User
