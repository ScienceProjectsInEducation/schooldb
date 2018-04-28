const Sequelize = require('sequelize')
const Op = Sequelize.Op
module.exports = class showData {
  // Inject Dependency (database Model)

  constructor (school) {
    this.School = school
  }

  async fetchData ({offset = 0, limit = 100, order = ['id'], searchValues = []}) {
    const attributes = []

    Object.keys(searchValues).forEach(key => {
      const fields = {}

      if (searchValues[key].startsWith('-')) { // if the values starts with '-' , we will exclude it from the search , (using notregexp)
        fields[key] = {[Op.notRegexp]: searchValues[key].substring(1)}
      } else {
        fields[key] = {[Op.regexp]: searchValues[key]}
      }
      attributes.push(fields)
    // the value of the current key.
    })

    const usedForAttribute = {}
    usedForAttribute['used_for'] = null
    attributes.push(usedForAttribute)

    return this.School.findAndCountAll({
      offset: (offset) * limit,
      limit: limit,
      order: order,
      where: attributes
    })
  }

  /**
 *
 * @param {int} id
 * @returns {school:school}
 */
  async getSchool (id) {
    return this.School.findOne({ where: {id: id} })
  }
}
