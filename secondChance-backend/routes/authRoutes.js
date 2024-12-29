const express = require('express')
const router = express.Router()
const connectToDatabase = require('../models/db')
const logger = require('../logger')

const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { validationResult } = require('express-validator')

router.put('/update', async (req, res) => {

  // Task 2: Validate the input using `validationResult` and return an appropriate message if you detect an error
  
  try {
    const validationErrors = validationResult(req)
    
    if (!validationErrors.isEmpty()) {
      logger.error('Update request has validation errors!', validationErrors.array())
      return res.status(400).json({ errors: validationErrors.array() })
    }

    // Task 3: Check if `email` is present in the header and throw an appropriate error message if it is not present

    const email = req.headers.email 

    if (!email) {
      logger.error('Email is not present in the request headers.')
      return res.status(400).json({ error: 'Email is not present in the request headers.' })
    }

    // Task 4: Connect to MongoDB

    const db = await connectToDatabase()
    
    const collection = db.collection('users')

    // Task 5: Find the user credentials in database

    const existingUser = await collection.findOne({ email: email })

    existingUser.updatedAt = new Date()

    // Task 6: Update the user credentials in the database

    if (req.body.firstName) {
      existingUser.firstName = req.body.firstName
    }

    if (req.body.lastName) {
      existingUser.lastName = req.body.lastName
    }

    if (req.body.password) {
      const salt = await bcryptjs.genSalt(10)
      const hash = await bcryptjs.hash(req.body.password, salt)
      existingUser.password = hash
    }

    const updatedUser = await collection.findOneAndUpdate(
      { email },
      { $set: existingUser },
      { returnDocument: "after" }
    )

    // Task 7: Create JWT authentication with `user._id` as a payload using the secret key from the .env file

    const payload = {
      user: { id: updatedUser._id.toString() }
    }

    const authtoken = jwt.sign(payload, process.env.JWT_SECRET)

    res.json({ authtoken })
      
  } catch (e) {
    return res.status(500).send('Internal server error')
  }

}) ;

router.post('/register', async (req, res) => {

  try {

    // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.

    const db = await connectToDatabase()

    // Task 2: Access MongoDB `users` collection

    const collection = db.collection('users')

    // Task 3: Check if user credentials already exists in the database and throw an error if they do

    const email = await collection.findOne({ email: req.body.email })

    if (email) {
      logger.error('User already exists with this email')
      return res.status(400).json({ error: 'User already exists with this email' })
    }

    // Task 4: Create a hash to encrypt the password so that it is not readable in the database

    const salt = await bcryptjs.genSalt(10)

    const hash = await bcryptjs.hash(req.body.password, salt)

    // Task 5: Insert the user into the database

    const newUser = await collection.insertOne({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: hash,
      createdAt: new Date()
    }) ; 

    // Task 6: Create JWT authentication if passwords match with user._id as payload

    const payload = { 
      user: { id: newUser.insertedId } 
    } ; 

    const authtoken = jwt.sign(payload, process.env.JWT_SECRET)

    // Task 7: Log the successful registration using the logger

    logger.info('User successfully registered!')

    // Task 8: Return the user email and the token as a JSON

    res.status(200).json({ authtoken: authtoken, email: req.body.email })

  } catch (e) {
    console.log('Error: ', e)
    return res.status(500).send('Internal server error')
  }

}) ;

router.post('/login', async (req, res) => {

  try {

    // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
    
    const db = await connectToDatabase()

    // Task 2: Access MongoDB `users` collection

    const collection = db.collection('users')

    // Task 3: Check for user credentials in database

    const userLoggingIn = await collection.findOne({ email: req.body.email })

    // Task 4: Check if the password matches the encrypted password and send appropriate message on mismatch

    if (userLoggingIn) {

      const passwordMatch = await bcryptjs.compare(req.body.password, userLoggingIn.password)

      if (!passwordMatch) {
          logger.error('The passwords don't match!')
          return res.status(404).json({ error: 'Incorrect password' })              
      }

      // Task 5: Fetch user details from a database

      const userName = userLoggingIn.firstName
      const userEmail = userLoggingIn.email

      // Task 6: Create JWT authentication if passwords match with user._id as payload

      const payload = {
          user: { id: userLoggingIn._id.toString() }
      } ; 

      const authtoken = jwt.sign(payload, process.env.JWT_SECRET)

      res.json({ authtoken, userName, userEmail })

      // Task 7: Send appropriate message if the user is not found
    } else {
      logger.error('User was not found')
      return res.status(404).json({ error: 'User was not found' })
    }

  } catch (e) {
    return res.status(500).send('Internal server error')
  }
}) ; 

module.exports = router ;
