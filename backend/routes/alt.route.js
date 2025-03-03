const express = require('express')

const alt = require('../controllers/alt.controller.js')

const router = express.Router()

router.get('/', alt)

module.exports = router
