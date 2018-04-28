const electron = require('electron')
const html = require('choo/html')
const navbar = require('./navbar')
const {ipcRenderer} = electron
const $ = require('jquery')

module.exports = function (state, emit) {
  var bodyClass = ''
  if (state.summary === null) {
    bodyClass = 'loading'
    ipcRenderer.send('loadSummary')
  }

  return html`
    <body class="${bodyClass}">
      ${navbar(emit)}
      <div class="card" id="summaryView">
        <div class="card-header">
          <h1>Summary</h1>
        </div>
        <div class="card-body">
          ${renderAmountText()}
        </div>
        ${renderSummaries(state.summary)}
      </div>
      <div class="wait"></div>
    </body>
  `

  function renderSummaries (summary) {
    if (summary === null) return ''
    return [
      renderDataTable('States', 'State', summary.states),
      renderDataTable('Types', 'Type', summary.schooltypes),
      renderDataTable('Empty data', 'Column', summary.badColumns),
      renderDataTable('Sources', 'created by', summary.createdBy),
      renderDataTable('Outdated data', 'used for', summary.usedFor)
    ]
  }

  function renderAmountText () {
    return html`
      <div class="card">
        <div class="card-header">
          <h3>Total</h3>
        </div>
        <div class="card-body">
          <p>${state.current ? state.current : '...'} schools</p>
        </div>
      </div>
    `
  }

  function renderDataTable (title, columnHeader, data) {
    return html`
      <div class="card-body">
        <div class="card">
          <div class="card-header">
            <h3>${title}</h3>
          </div>
          <div class="card-body">
            <table class="table table-sm table-striped table-bordered">
              <thead>
                <tr>
                  <th scope="col">${columnHeader}</th>
                  <th scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${data.map((row) => createRow(row, columnHeader))}
                <th scope="row">Sum</th>
                <td>${data.reduce((acc, current) => acc + current[1], 0)}</td>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    `
  }

  function createRow (row, columnHeader) {
    var clas = ''
    if (columnHeader === 'State' || columnHeader === 'Type' || columnHeader === 'Column') {
      clas = 'hover'
    }

    return html`
      <tr>
        <td class=${clas} onclick=${() => showInfo(row[0], columnHeader)}>${row[0]}</td>
        <td>${row[1]}</td>
      </tr>
    `
  }
  function showInfo (value, columnHeader) {
    state.search_values = {}
    var summarysource = ''

    switch (columnHeader) {
      case 'State': {
        $('body').addClass('loading')
        state.search_values['state'] = value === '' ? '^$' : `^${value}$`
        state.offset = 0
        state.sorting = [
          ['id', 'ASC']
        ]
        summarysource = 'state'
        ipcRenderer.send('fetchData', {offset: state.offset, order: state.sorting, searchValues: state.search_values, limit: state.limit, source: summarysource})
        break
      }
      case 'Type': {
        $('body').addClass('loading')
        state.search_values['type'] = value === '' ? '^$' : `^${value}$`
        state.offset = 0
        state.sorting = [
          ['id', 'ASC']
        ]
        summarysource = 'type'
        ipcRenderer.send('fetchData', {offset: state.offset, order: state.sorting, searchValues: state.search_values, limit: state.limit, source: summarysource})
        break
      }
      case 'Column': {
        $('body').addClass('loading')
        state.search_values[value] = '^$'
        state.offset = 0
        state.sorting = [
          ['id', 'ASC']
        ]
        ipcRenderer.send('fetchData', {offset: state.offset, order: state.sorting, searchValues: state.search_values, limit: state.limit, source: value})
        break
      }
    }
  }
}
