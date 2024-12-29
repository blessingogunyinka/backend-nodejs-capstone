const express = require('express')
const multer = require('multer')
const router = express.Router()
const connectToDatabase = require('../models/db')
const logger = require('../logger')

// Define the upload directory path
const directoryPath = 'public/images'

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath) // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Use the original file name
  }
})

const upload = multer({ storage })

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
  logger.info('/ called')
  try {
    // Step 2: task 1 - insert code here
    const db = await connectToDatabase()

    // Step 2: task 2 - insert code here
    const collection = db.collection(process.env.MONGO_COLLECTION)

    // Step 2: task 3 - insert code here
    const secondChanceItems = await collection.find({}).toArray()

    // Step 2: task 4 - insert code here
    res.json(secondChanceItems)
  } catch (e) {
    logger.error('oops something went wrong', e)
    next(e)
  }
})

// Add a new item
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    // Step 3: task 1 - insert code here
    const db = await connectToDatabase()

    // Step 3: task 2 - insert code here
    const collection = db.collection(process.env.MONGO_COLLECTION)

    // Step 3: task 3 - insert code here
    let secondChanceItem = req.body
    secondChanceItem.age_days = Number(secondChanceItem.age_days)
    secondChanceItem.age_years = Number(secondChanceItem.age_years)

    // Step 3: task 4 - insert code here
    const lastId = await collection.find().sort({ id: -1 }).limit(1)
    await lastId.forEach(item => (secondChanceItem.id = (Number(item.id) + 1).toString()))

    // Step 3: task 5 - insert code here
    const currentDate = Math.floor(Date.now() / 1000)
    secondChanceItem.date_added = currentDate

    secondChanceItem = await collection.insertOne(secondChanceItem)

    res.status(201).json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
  try {
    // Step 4: task 1 - insert code here
    const db = await connectToDatabase()

    // Step 4: task 2 - insert code here
    const collection = db.collection(process.env.MONGO_COLLECTION)

    // Step 4: task 3 - insert code here
    const id = req.params.id
    const secondChanceItem = await collection.findOne({ id })

    // Step 4: task 4 - insert code here
    if (secondChanceItem) {
      return res.status(200).json(secondChanceItem)
    } else {
      return res.status(404).json({ error: 'Item not found.' })
    }
  } catch (e) {
    next(e)
  }
})

// Update and existing item
router.put('/:id', async (req, res, next) => {
  try {
    // Step 5: task 1 - insert code here
    const db = await connectToDatabase()

    // Step 5: task 2 - insert code here
    const collection = db.collection(process.env.MONGO_COLLECTION)

    // Step 5: task 3 - insert code here
    const id = req.params.id
    const secondChanceItem = await collection.findOne({ id })
    if (!secondChanceItem) {
      logger.error('Item not found')
      return res.status(404).json({ error: 'Item not found' })
    }

    // Step 5: task 4 - insert code here
    if (req.body.age_days) {
      secondChanceItem.age_days = Number(req.body.age_days)
    }
    if (req.body.condition) {
      secondChanceItem.condition = req.body.condition
    }
    if (req.body.description) {
      secondChanceItem.description = req.body.description
    }
    if (req.body.category) {
      secondChanceItem.category = req.body.category
    }
    if (req.body.name) {
      secondChanceItem.name = req.body.name
    }
    if (req.body.zipcode) {
      secondChanceItem.zipcode = req.body.zipcode
    }
    if (req.body.image) {
      secondChanceItem.image = req.body.image
    }
    if (req.body.comments) {
      secondChanceItem.comments = req.body.comments
    }

    secondChanceItem.age_years = Number((secondChanceItem.age_days / 365).toFixed(1))
    secondChanceItem.updatedAt = new Date()

    const updatedSecondChanceItem = await collection.findOneAndUpdate(
      { id },
      { $set: secondChanceItem },
      { returnDocument: 'after' }
    )

    // Step 5: task 5 - insert code here
    if (updatedSecondChanceItem) {
      return res.status(200).json({ message: 'Successful upload' })
    } else {
      return res.status(500).json({ message: 'Upload failed' })
    }
  } catch (e) {
    next(e)
  }
})

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
  try {
    // Step 6: task 1 - insert code here
    const db = await connectToDatabase()

    // Step 6: task 2 - insert code here
    const collection = db.collection(process.env.MONGO_COLLECTION)

    // Step 6: task 3 - insert code here
    const id = req.params.id
    const secondChanceItem = await collection.findOne({ id })
    if (!secondChanceItem) {
      logger.error('Item not found')
      return res.status(404).json({ error: 'Item not found' })
    }

    // Step 6: task 4 - insert code here
    await collection.deleteOne({ id })
    return res.status(200).json({ message: 'Deletion successful' })
  } catch (e) {
    next(e)
  }
})

module.exports = router
