const User = require('../models/User.js')
const Post = require('../models/Post.js')
const Follow = require('../models/Follow.js')


//Lacinak 
//Pusholtam most az lemaradt ket valtoztatast
//KOMMENT END ******

exports.doesUsernameExist = function(req, res){
    User.findByUserName(req.body.username).then(function(){
        res.json(true)
    }).catch(function(){
        res.json(false)
    })
} 

exports.doesEmailExist = async function(req, res){
    let emailBool = await User.doesEmailExist(req.body.email)
    res.json(emailBool)

}



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
/*
uj funkcio:  
ha az user be van jelentkezve, akkor az o sajat  nyito oldalara betoltodnek az adatbazisbol  azok a posztok 
amelyeket azok az egyeb userek posztoltak akiket az user alapbol mar kovet,  idoszerint felsorolva, a legujabbak felul.
1. lepes: lekerjuk egy tomb-be a follows collectionsbol azokat az followedId-kat, akiket mi kovetunk.
2. lepes: lekerjuk a posts collectionsbol azokat a posztokat ahol az authorId benne van a fenti tomb-ben, 
a teljes vegeredmenyt ido szerint szoritorzva.     

a kovetkezo fejlesztes: LIVE FEED lesz
*/
exports.home =  async function(req, res) {
    if (req.session.user) {
        //posts of current followed users
        let posts = await Post.getFeed(req.session.user._id)
        res.render('home-dashboard', {posts:posts})
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
            title: `Profile for ${req.profileUser.username}`,
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
        title: `Profile for ${req.profileUser.username}`,
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



