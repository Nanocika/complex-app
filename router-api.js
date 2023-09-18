const apiRouter = require('express').Router()

const userController = require('./controllers/userController.js')
const postController = require('./controllers/postController.js')
const followController = require('./controllers/followController.js')

   apiRouter.post('/login', userController.apiLogin)
   
module.exports = apiRouter