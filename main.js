const electron = require('electron')
const url = require('url')
const path = require('path')
const _ = require('lodash')
const Store = require('electron-store')
const electronDebug = require('electron-debug')
const createDatabase = require('./lib/database')
const CsvImportExport = require('./lib/csv')
const compareSchools = require('./lib/compare-schools')
const changeProperties = require('./lib/changeProperties')
const findSimilar = require('./lib/find-similars')
const loadSummary = require('./lib/summary')
const loadActions = require('./lib/actions')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const Datahandler = require('./lib/showData')
const {mysteriousValue} = require('./lib/mysteriousValue')
const parallel = require('run-parallel')

electronDebug()

const settings = new Store({
  defaults: {
    db: 'mysql://root@localhost:3306/kischule',
    googleMapsKey: null
  }
})

const googleMapsClient = require('@google/maps').createClient({
  key: settings.get('googleMapsKey'),
  language: 'de'
})

const {app, BrowserWindow, Menu, ipcMain} = electron

let mainWindow

async function start () {
  const {School, Action, Match, DontMerge, SourceType, Source, sequelize} = await createDatabase(settings.get('db'))
  showSchoolCount(School)
  loadSourceEnum(SourceType)
  var DataRender = new Datahandler(School)
  const csvHandler = new CsvImportExport(School, Action)

  csvHandler.on('chunkSent', data => {
    mainWindow.webContents.send('files_imported', data)
  })

  csvHandler.on('finished', () => {
    showSchoolCount(School)
  })

  ipcMain.on('flushdb', (e) => {
    School.destroy({
      truncate: true
    }).then(() => {
      showSchoolCount(School)
    })
  })

  ipcMain.on('dontMerge', async (e, {sourceSchoolIds, comment}) => {
    DontMerge.create({
      id1: sourceSchoolIds[0],
      id2: sourceSchoolIds[1],
      comment: comment
    }).then(() => {
      mainWindow.webContents.send('dontMergeDone')
    })
  })

  ipcMain.on('ignoreDontMerge', async (e, {schools, dontMerges, mapsResults}) => {
    const schoolIds = schools.map(school => school.id)
    await DontMerge.destroy({
      where: {
        id1: {[Op.in]: schoolIds},
        id2: {[Op.in]: schoolIds}
      }
    })

    mainWindow.webContents.send('schoolsLoadedForChange', {schools, mapsResults})
  })

  async function schoolsLoadedForChange ({schoolIds, schools, sources, mapsResults}) {
    let notused = schools.filter(school => school.used_for !== null).length === 0

    if (schools.length > 0 && notused) {
      if (schoolIds.length > 1) {
        let dontMerges = await DontMerge.findAll({
          where: {
            id1: {[Op.in]: schoolIds},
            id2: {[Op.in]: schoolIds}
          }
        })
        if (dontMerges.length > 0) {
          dontMerges = dontMerges.map(dontMerge => dontMerge.dataValues)
          mainWindow.webContents.send('dontMerge', {schools, dontMerges, mapsResults})
          return
        }
      }
      mainWindow.webContents.send('schoolsLoadedForChange', {schools, sources, mapsResults})
    } else {
      if (notused) {
        mainWindow.webContents.send('errorChannel', 'Entered schools does not exist. Please check input.')
      } else {
        mainWindow.webContents.send('errorChannel', 'Entered schools are outdated.')
      }
    }
  }

  async function findSourcesForAction (actionId) {
    const sourceModels = await Source.findAll({where: { action: actionId }})
    const sources = sourceModels.map(model => model.dataValues)
    return _.keyBy(sources, 'field')
  }

  ipcMain.on('loadSchoolsForChange', async (e, schoolIds) => {
    let schools = await School.findAll({ where: { id: { [Op.in]: schoolIds } } })
    schools = schools.map(school => school.dataValues)
    const sources = await Promise.all(schools.map(school => findSourcesForAction(school.created_by)))

    const mapsAPITasks = schools.map(school => {
      return function (callback) {
        const hnr = school.house_nr !== null ? ' ' + school.house_nr : ''
        googleMapsClient.geocode({
          address: school.street + hnr + ', ' + school.city
        }, callback)
      }
    })

    parallel(mapsAPITasks, function (error, results) {
      if (!error) {
        let mapsResults = []
        results.forEach(result => {
          if (result.json.results[0] !== undefined) {
            const postalCodes = result.json.results[0].address_components.filter(comp => comp.types[0] === 'postal_code')
            const postalCode = postalCodes.length > 0 ? postalCodes[0].long_name : null
            const routes = result.json.results[0].address_components.filter(comp => comp.types[0] === 'route')
            const route = routes.length > 0 ? routes[0].long_name : null
            const streetNumbers = result.json.results[0].address_components.filter(comp => comp.types[0] === 'street_number')
            const streetNumber = streetNumbers.length > 0 ? streetNumbers[0].long_name : null
            const countries = result.json.results[0].address_components.filter(comp => comp.types[0] === 'country' && comp.types[1] === 'political')
            const country = countries.length > 0 ? countries[0].long_name : null
            const localities = result.json.results[0].address_components.filter(comp => comp.types[0] === 'locality' && comp.types[1] === 'political')
            const locality = localities.length > 0 ? localities[0].long_name : null
            const formattedAddress = result.json.results[0].formatted_address
            mapsResults.push({
              postalcode: postalCode,
              street: route,
              house_nr: streetNumber,
              country: country,
              city: locality,
              formatted_address: formattedAddress,
              lat: result.json.results[0].geometry.location.lat,
              lng: result.json.results[0].geometry.location.lng
            })
          } else {
            mapsResults.push({
              plz: null,
              strasse: null,
              hausnr: null,
              land: null,
              stadt: null,
              formatted_address: null
            })
          }
        })
        schoolsLoadedForChange({schoolIds, schools, sources, mapsResults})
      } else {
        console.log(error)
      }
    })
  })

  ipcMain.on('changeSchools', async (e, {newSchool, sourceSchoolIds, sources}) => {
    const actionType = sourceSchoolIds.length === 1 ? 'change' : 'merge'

    const action = await Action.create({type: actionType})
    const actionId = action.dataValues.id
    newSchool['created_by'] = actionId

    await Source.bulkCreate(sources.map(change => {
      return {
        action: actionId,
        type: change.sourceType,
        field: change.property,
        school: change.schoolId
      }
    }))

    await School.update({used_for: action.dataValues.id}, {
      where: {
        id: { [Op.or]: sourceSchoolIds }
      }
    })

    // Most Similars für neue Schule finden und eintragen
    School.create(newSchool).then(async function (school) {
      let mostSimilarSchools = await findSimilar(School, school)
      let goodArray = mostSimilarSchools.schools.map((similar, i) => {
        return {
          id1: school.id,
          id2: similar.id,
          value: mostSimilarSchools.similarities[i]
        }
      })

      Match.bulkCreate(goodArray.filter(similar => similar.value > mysteriousValue))

      mainWindow.webContents.send('schoolsChanged')
    })
  })

  ipcMain.on('getMostSimilarSchools', async (e, {id, amount}) => {
    try {
      const inputSchool = (await School.findOne({where: {id}})).dataValues

      const {schools, similarities} = await findSimilar(School, inputSchool, amount)
      mainWindow.webContents.send('similarSchoolsLoaded', {
        inputSchool: inputSchool,
        similarSchools: schools,
        similarities: similarities
      })
    } catch (error) {
      mainWindow.webContents.send('errorChannel', `Entered school with ID ${id} does not exist. Please check input.`)
    }
  })

  ipcMain.on('loadSummary', () => {
    loadSummary(mainWindow, changeProperties, Sequelize, School, Action, sequelize)
  })

  ipcMain.on('loadActions', () => {
    loadActions(mainWindow, sequelize)
  })

  ipcMain.on('deleteSchool', async (e, id) => {
    const action = await Action.create({type: 'delete'})
    await School.update(
      {
        used_for: action.dataValues.id
      }, {
        where: {
          id: id
        }
      }
    )
    mainWindow.webContents.send('schoolDeleted')
  })

  ipcMain.on('fetchHistory', async (e, {id}) => {
    const school = (await School.find({ where: { id } })).dataValues
    const history = await buildHistory(school)
    mainWindow.webContents.send('historyLoaded', history)
  })

  async function buildHistory (school) {
    const createdBy = school.created_by
    const schoolModels = await School.findAll({ where: {used_for: createdBy} })
    const schools = schoolModels.map(school => school.dataValues)
    const action = await Action.find({ where: { id: createdBy } })
    const actionId = action.dataValues.id
    const sources = await Source.findAll({ where: { action: actionId } })
    const sourceTypes = await SourceType.findAll().map(school => school.dataValues)

    const changedAttributes = {} // key: attribute, value: source title
    for (var attr in school) {
      var attributeSource = sources.find(source => source.field === attr)
      if (attributeSource && attributeSource.type) {
        changedAttributes[attr] = sourceTypes.find(sourceType => sourceType.id === attributeSource.type).title
      }
    }
    return {
      school,
      changedAttributes,
      type: action.dataValues.type,
      nodes: await Promise.all(schools.map(buildHistory))
    }
  }

  ipcMain.on('undoAction', (e, actionId) => {
    const deleteMatchesQuery = `
      DROP TABLE IF EXISTS temp_ids;
      CREATE TABLE temp_ids AS (SELECT id FROM schools WHERE created_by = ${actionId});
      DELETE FROM matches WHERE id1 IN (SELECT * FROM temp_ids) OR id2 IN (SELECT * FROM temp_ids);
      DROP TABLE temp_ids;
    `
    sequelize.query(deleteMatchesQuery).then(() => {
      School.destroy({
        where: {
          created_by: actionId
        }
      }).then(() => {
        Action.destroy({
          where: {
            id: actionId
          }
        }).then(() => {
          loadActions(mainWindow, sequelize)
          showSchoolCount(School)
        })
      })
    })
  })

  ipcMain.on('invalidateActions', () => {
    mainWindow.webContents.send('invalidateActions')
  })

  ipcMain.on('invalidateSummary', () => {
    mainWindow.webContents.send('invalidateSummary')
  })

  electron.ipcMain.on('fetchData', function (event, {offset, limit, order, searchValues, source = null}) {
    DataRender.fetchData({offset, limit, order, searchValues}).then((result) => mainWindow.webContents.send('fetchData', {result, source}))
      .catch(

        (reason) => {
        // todo :  handle error here
          mainWindow.webContents.send('fetchData', '')
        })
  })

  // find school by ID
  electron.ipcMain.on('getSchoolbyID', function (event, id) {
    DataRender.getSchool(id).then((school) => (event.returnValue = school.dataValues))
  })

  ipcMain.on('csv', (e, info) => {
    if (info.action === 'import') { csvHandler.import(info.type) } else { csvHandler.export(info.type) }
  })

  ipcMain.on('findMatches', (e, {from, to, m}) => {
    let schools = []
    let similarityArr = []
    console.log(`Computing similarity for schools from ${from} to ${to}`)

    School.findAndCountAll({
      where: {
        used_for: null,
        id: {
          [Op.and]: {
            [Op.gte]: from,
            [Op.lte]: to
          }
        }
      },
      order: [['id', 'asc']]
    }).then(result => {
      result.rows.forEach(school => schools.push(school.dataValues))

      for (let i = 0; i < result.count; i++) {
        for (let j = 0; j <= i; j++) {
          if (i === j) { continue }
          const value = compareSchools(schools[i], schools[j])
          if (value > mysteriousValue) {
            similarityArr.push({
              value: value,
              schools: {i: schools[i].id, j: schools[j].id},
              title: [schools[i].title, schools[j].title]
            })
          }
        }
      }

      let matches = []

      similarityArr.forEach(school => {
        matches.push({
          id1: school.schools.i,
          id2: school.schools.j,
          value: school.value
        })
      })

      chunkInsert(Match, matches)

      const res = _.take(_.orderBy(similarityArr, [(o) => { return o.value }], 'desc'), m)
      mainWindow.webContents.send('matchesFound', res)
    })
  })

  async function chunkInsert (dataModel, modelInstances, chunkSize = 200) {
    const chunkedUpdates = _.chunk(modelInstances, chunkSize).map(modelInstance => () => dataModel.bulkCreate(modelInstance))
    for (let i = 0; i < chunkedUpdates.length; i++) {
      await chunkedUpdates[i]()
    }
  }

  const mainMenuTemplate = [{
    label: 'Quit',
    accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
    click () {
      app.quit()
    }
  }
  ]

  if (process.platform === 'darwin') mainMenuTemplate.unshift({})

  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
  Menu.setApplicationMenu(mainMenu)
}

app.on('ready', async function () {
  let {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
  width = 0.75 * width
  height = 0.75 * height
  mainWindow = new BrowserWindow({width, height})
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'mainWindow.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.webContents.on('dom-ready', start)

  mainWindow.on('closed', () => app.quit())
})

function showSchoolCount (School) {
  School.count({where: { used_for: null }}).then(c => {
    mainWindow.webContents.send('count', c)
  })
}

function loadSourceEnum (SourceType) {
  SourceType.findAll().then(result => {
    mainWindow.webContents.send('sourceEnumLoaded', result.map(r => r.dataValues))
  })
}
