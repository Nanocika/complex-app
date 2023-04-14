const User = require('../models/User.js')
const Post = require('../models/Post.js')
const Follow = require('../models/Follow.js')


//Lacinak 
//KOMMENT BEGIN ****** 
// A kovetes funkcio mukodik mindenhol, ehhet mar nem is több fejlesztes. Ahhoz hogy tesztelni lehessen, 
//tobb userel egymast ide oda kovetni kell es akkor az adott User Profile lapjan
// a Followers(kik kovetik az usert)/ Following (kiket kovet ez az User  ) lehet ezeke csekkolni. ((-:)
//KOMMENT END ******

exports.sharedProfileData= async function (req, res, next) {
    let isVisitorsProfile = false
    let isFollowing = false
    if (req.session.user) {
       isVisitorsProfile = req.profileUser._id.equals(req.session.user._id) 
       isFollowing =  await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)  
    } 
    req.isVisitorProfile = isVisitorsProfile
    req.isFollowing = isFollowing

    //retrieve post, follower and following counts

    //uj technika promise-ra : nem var egyik se a masikra 
    let postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
    let followerCountPromise = Follow.countFollowersById(req.profileUser._id)
    let followingCountPromise = Follow.countFollowingById(req.profileUser._id)

    //Array destructuring 
    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])
    console.log(postCount +"TESZT")
    req.postCount = postCount
    req.followerCount = followerCount
    req.followingCount = followingCount
     

    next()
}


exports.mustBeLoggedIn = function(req,res, next){
 if (req.session.user){
    next()
 } else{
    req.flash("errors", "You must be logged in to perform that action")
    req.session.save(function(){
        res.redirect('/')
    })
 }
}
exports.login =  function(req, res) {
    let user = new User(req.body)
    user.login().then(function(result){
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
        req.flash('success', result)
        //callback mukodik
        req.session.save(function() {
            res.redirect('/')
        })

    }).catch(function(result){
        //the req.flash line doing this : add to the session a flash property with an error (array) value 
        //which has one another value = e >>> req.session.flash.errors = [e]
        //callback mukodik
        req.flash('errors', result)
        req.session.save(function(){
           res.redirect('/') 
         })
                
    })
}
exports.logout = function(req, res) {
    //callback mukodik
    req.session.destroy(function() {
      res.redirect('/')
    })
}
//chatgpt
/*exports.logout =  async function(req, res) {
    await req.session.destroy()
    res.redirect('/')
}*/

exports.register =  function(req, res) {
    let user = new User(req.body)
    user.register().then(()=>{
      req.session.user ={username: user.data.username, avatar: user.avatar, _id: user.data._id}
      req.session.save(function(){
        res.redirect('/')
      })
    }).catch((regErrors)=>{
        regErrors.forEach(function(error){
            req.flash('regErrors', error)
        })
        req.session.save(function(){
            res.redirect('/')
        })
    })
}
exports.home =  function(req, res) {
    if (req.session.user) {
        res.render('home-dashboard')
    } else {
        res.render('home-guest', {regErrors: req.flash('regErrors')}) 
    }
}
exports.ifUserExists =  function(req, res, next) {
    User.findByUserName(req.params.username).then(function (userDocument) {
        req.profileUser = userDocument
        next()
    }).catch(function () {
        res.render("404")
    })
}
exports.profilePostsScreen =  function(req, res,) {
    //ask our post model for multiple posts by a certain author id
    Post.findByAuthorId(req.profileUser._id).then(function(posts) {
        res.render('profile', {
            currentPage: "posts", 
            posts:posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorProfile: req.isVisitorProfile,
            counts:{postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}

        })
    }).catch(function() {
        res.render("404")
    })
}


exports.profileFollowersScreen = async function (req, res) {
   try {
    let followers = await Follow.getFollowersById(req.profileUser._id)
    res.render('profile-followers', {
        currentPage: "followers",  
        followers: followers,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing: req.isFollowing,
        isVisitorProfile: req.isVisitorProfile,
        counts:{postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}    
   }) 
   } catch {
        res.render("404")
   }
}

exports.profileFollowingScreen = async function (req, res) {
    try {
     let following = await Follow.getFollowingById(req.profileUser._id)
     res.render('profile-following', {
         currentPage: "following",   
         following: following,
         profileUsername: req.profileUser.username,
         profileAvatar: req.profileUser.avatar,
         isFollowing: req.isFollowing,
         isVisitorProfile: req.isVisitorProfile,
         counts:{postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}    
    }) 
    } catch {
         res.render("404")
    }
 }



