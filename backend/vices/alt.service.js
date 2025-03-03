const gamin = require('../altData.js')

const getAllAlts = async () => {
  // simulate a delay
  const data = await new Promise(resolve => setTimeout(() => resolve(gamin), 500))

  return data
}

module.exports = getAllAlts
