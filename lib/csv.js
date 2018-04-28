const electron = require('electron')
const {dialog} = electron
const path = require('path')
const EventEmitter = require('events')
const csvParse = require('csv-parser')
const csvWriter = require('csv-write-stream')
const concat = require('concat-stream')
const fs = require('fs')
const _ = require('lodash')
const csvColumns = require('./columns')

const dialogOpts = {
  filters: [{ name: 'CSV-Dateien', extensions: ['csv'] }],
  properties: ['openFile']
}

module.exports = class csvImportExport extends EventEmitter {
  constructor (schoolModel, actionModel) {
    super()
    this.schoolModel = schoolModel
    this.actionModel = actionModel
  }

  import (type) {
    dialog.showOpenDialog(dialogOpts, (filePath) => {
      try {
        this.actionModel.create({
          type: 'import',
          source: type,
          filename: path.basename(filePath[0])
        }).then(action => {
          this.action = action
          fs.createReadStream(filePath[0])
            .pipe(csvParse({separator: ';'}))
            .pipe(concat(data => {
              this.insertData(data, type)
            }))
        })
      } catch (e) {

      }
    })
  }

  export (type) {
    dialog.showSaveDialog(async (filePath) => {
      const schools = await this.schoolModel.findAll({
        attributes: this.getCsvExportAttributes(type),
        where: {
          used_for: null

        }
      })
      const writer = csvWriter({separator: ';'})
      writer.pipe(fs.createWriteStream(filePath))
      schools.forEach(school => writer.write(school.dataValues))
      writer.end()
    })
  }

  async insertData (data, type) {
    const chunkSize = 200
    const schools = data.map(school => this.convertToSchool(school, type))
    const chunkedUpdates = _.chunk(schools, chunkSize).map(someSchools => () => this.schoolModel.bulkCreate(someSchools))
    for (let i = 0; i < chunkedUpdates.length; i++) {
      await chunkedUpdates[i]()
      this.emit('chunkSent', {
        current: Math.min((i + 1) * chunkSize, data.length),
        total: data.length
      })
    }
    this.emit('finished')
  }

  getCsvExportAttributes (type) {
    const csvExportAttributes = []

    for (let i = 0; i < Object.values(csvColumns[type]).length; i++) {
      csvExportAttributes.push([Object.values(csvColumns[type])[i], Object.keys(csvColumns[type])[i]])
    }

    return csvExportAttributes
  }

  convertToSchool (schule, type) {
    const schulEintrag = {}

    const columns = csvColumns[type]

    for (let key in schule) {
      schulEintrag[columns[key]] = schule[key]
      schulEintrag['created_by'] = this.action.dataValues.id
    }
    return schulEintrag
  }
}
