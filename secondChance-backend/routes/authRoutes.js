const express = require("express") ;
const router = express.Router() ;
const connectToDatabase = require("../models/db") ;
const logger = require('../logger') ;

const bcryptjs = require("bcryptjs") ; 
const jwt = require("jsonwebtoken") ; 


router.post("/register", async (req, res) => {

    try {

        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.

        const db = await connectToDatabase() ; 

        // Task 2: Access MongoDB `users` collection

        const collection = db.collection("users") ;

        // Task 3: Check if user credentials already exists in the database and throw an error if they do

        const email = await collection.findOne({ email: req.body.email }) ; 

        if (email) {
            logger.error("User already exists with this email") ; 
            return res.status(400).json({ error: "User already exists with this email" }) ; 
        }

        // Task 4: Create a hash to encrypt the password so that it is not readable in the database

        const salt = await bcryptjs.genSalt(10) ; 

        const hash = await bcryptjs.hash(req.body.password, salt) ; 

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

        const token = jwt.sign(payload, process.env.JWT_SECRET) ; 

        // Task 7: Log the successful registration using the logger

        logger.info("User successfully registered!") ;

        // Task 8: Return the user email and the token as a JSON

        res.status(200).json({ token: token, email: req.body.email }) ; 

    } catch (e) {
        console.log("Error: ", e) ; 
        return res.status(500).send("Internal server error") ;
    }

}) ;

module.exports = router ;