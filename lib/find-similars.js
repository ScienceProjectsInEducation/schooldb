const createDatabase = require('./database')
const compareSchools = require('./compare-schools')

module.exports = getMostSimilars

async function getMostSimilars (School, school, amount = 0) {
  console.log('Fetching schools...')
  const schools = await School.findAll().map(school => school.dataValues)
  console.log('Number of schools:', schools.length)
  console.log('Finding similar for', school.title, school.id, '...')

  let bestMatches = getMostSimilarsFromList(school, schools)

  if (amount !== 0) { bestMatches = bestMatches.slice(0, amount) }

  return {
    schools: bestMatches.map(match => match[0]),
    similarities: bestMatches.map(match => match[1])
  }
}

function getMostSimilarsFromList (school, schools) {
  const compareValues = schools
    .filter(anotherSchool => anotherSchool.id !== school.id && !anotherSchool.used_for)
    .map(anotherSchool => {
      return [
        anotherSchool,
        compareSchools(school, anotherSchool)
      ]
    })
  compareValues.sort((a, b) => b[1] - a[1])
  return compareValues
}

async function main () {
  console.log('Connecting to datbase...')
  const dbUrl = 'mysql://db1108334-ki:7SKN0s381YXIbDgdFj2E@vwp3144.webpack.hosteurope.de:3306/db1108334-softwareprojekt'
  const {School} = await createDatabase(dbUrl)

  const startTime = Date.now()
  console.log('Fetching schools...')
  const schools = (await School.findAll({limit: 1000})).map(school => school.dataValues)
  console.log('Calculating...')
  const result = schools.map(school => [school].concat(getMostSimilarsFromList(school, schools)[0]))
  const endTime = Date.now()
  result.sort((a, b) => a[2] - b[2])
  result.forEach(pair => {
    console.log(String(Math.round(pair[2] * 100)), pair[0].title, pair[1].title)
  })
  console.log(`Dauer: ${(endTime - startTime) / 1000}s`)
  process.exit()
}

if (require.main === module) main()
