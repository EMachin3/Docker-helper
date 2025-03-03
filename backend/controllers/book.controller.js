const {Request, Response} = require('express')

const getAllBooks = require('../vices/book.service.js')

const all = async (req, res) => {
  try {
    const result = await getAllBooks()
    return res.status(200).send(result)
  } catch (error) {
    console.log(error)
    return res.status(500).send({ message: 'Something went wrong' })
  }
}

module.exports = all
