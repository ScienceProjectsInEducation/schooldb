const leven = require('leven')
const _ = require('lodash')

module.exports = calculateSimilarity

const defaultFields = [
  ['title', 0.3],
  ['street', 0.6],
  ['postalcode', 1],
  ['city', 1],
  ['state', 1]
]

function calculateSimilarity (schoolA, schoolB, fields = defaultFields) {
  const weights = fields.map(field => field[1])
  const similarities = fields.map(field => field[1] * sigmoid(leven(schoolA[field[0]], schoolB[field[0]])))

  return 1 - (_.sum(similarities) / _.sum(weights))
}

function sigmoid (input) {
  return Math.tanh(input / 7)
}
