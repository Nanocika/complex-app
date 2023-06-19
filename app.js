const express = require("express")
const session = require("express-session")
const MongoStore = require("connect-mongo")
const flash = require("connect-flash")
const markdown = require("marked")
const sanitizeHTML = require("sanitize-html")
const app = express()
let sessionOptions = session({
  secret: "JavaScript is sooooooooooo cool",
  store: MongoStore.create({ client: require("./db") }),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true }
})
app.use(sessionOptions)
app.use(flash())
//this app.use running for every request lived on webserver express
app.use(function (req, res, next) {
  //make our markdown function available from > within all ejs templates
  res.locals.filterUseHTML = function (content) {
    return sanitizeHTML(markdown.parse(content), { allowedTags: ["p", "br", "ul", "ol", "li", "strong", "bold", "i", "em", "h1", "h2", "h3", "h4", "h5", "h6"], allowedAttributes: {} })
  }
  //make all error and success flash messages available from > within all  ejs templates
  res.locals.errors = req.flash("errors")
  res.locals.success = req.flash("success")
  //make USER ID available from the req session object
  //make up a new visitorId living on request object  >> we can reliable thet always on request object  will be visitorID property
  if (req.session.user) {
    req.visitorId = req.session.user._id
  } else {
    req.visitorId = 0
  }
  //make user session data available from >> within view templates
  res.locals.user = req.session.user
  next()
})
const router = require("./router.js")
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static("public"))
app.set("views", "views")
app.set("view engine", "ejs")
app.use("/", router)

//express webserver added to server
const server = require("http").createServer(app)

//socket.io connections added to server
const io = require("socket.io")(server)

io.use(function (socket, next) {
  sessionOptions(socket.request, socket.request.res, next)
})

io.on("connection", function (socket) {
  //console.log("A new user from frontend  connected into (SOCKET.IO) 2")
  if (socket.request.session.user) {

    let user = socket.request.session.user
    
    socket.emit ('welcome', {username: user.username, avatar: user.avatar})

    socket.on("chatMessageFromBrowser", function (data) {
      //console.log(data.message)
      
      //socket.emit = response only for the browser which sent the message
      
      //this send for all browser connected to io, including the browser who sent the message
      //io.emit("chatMessageFromServer", { message: data.message, username: user.username, avatar: user.avatar })
      
      //this send to all browsers connected excepz to the browser who sent the message  
      socket.broadcast.emit("chatMessageFromServer", { message: sanitizeHTML(data.message,{allowedTags:[], allowedAttributes: {}}), username: user.username, avatar: user.avatar })
    })
  }
  
})

//our server now is going to power both our express app and our socket connections
//in db.js: where instead of telling just app to listen, is'is going to tell our overall server to begin listening

module.exports = server
