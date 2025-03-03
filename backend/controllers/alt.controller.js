const {Request, Response} = require('express')

const getAllAlts = require('../vices/alt.service.js')

const alt = async (req, res) => {
  try {
    const result = await getAllAlts()
    return res.status(200).send(result)
  } catch (error) {
    console.log(error)
    return res.status(500).send({ message: 'Something went wrong' })
  }
}

module.exports = alt;
