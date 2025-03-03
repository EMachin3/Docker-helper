const express = require('express')

const all = require('../controllers/book.controller.js')
const alt = require('../controllers/alt.controller.js')

const router = express.Router()

router.get('/', all)
router.get('/lol', alt)

module.exports = router
