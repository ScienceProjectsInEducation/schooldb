const electron = require('electron')

const {ipcRenderer} = electron
const devtools = require('choo-devtools')
const choo = require('choo')
const features = require('./views/FeaturesView')
const matchfinderView = require('./views/matchfinderView')
const changeView = require('./views/changeView')
const summaryView = require('./views/summaryView')
const similarView = require('./views/similarView')
const compareSchools = require('./lib/compare-schools')
const showView = require('./views/showView')
const actionsView = require('./views/actionsView')
const $ = require('jquery')
const historyView = require('./views/historyView')
const html = require('choo/html')

const GoogleMapsLoader = require('google-maps')
GoogleMapsLoader.KEY = process.env.GOOGLE_API_KEY
GoogleMapsLoader.LANGUAGE = 'de'

var app = choo()
app.use(devtools())
app.use(store)
app.route('/', summaryView)
app.route('/history', historyView)
app.route('/change', changeView)
app.route('/show', showView)
app.route('/summary', summaryView)
app.route('/matchfinder', matchfinderView)
app.route('/similar', similarView)
app.route('/actions', actionsView)
app.route('/features', features)
app.mount('body')

function store (state, emitter) {
  state.current_imported = 0
  state.total_imported = 0
  state.current = 0
  state.pagination = []
  state.eler = []
  state.error = []
  state.offset = 0
  state.datasource = null
  state.sorting = [
    ['id', 'ASC']
  ]
  state.schooltomerge = []
  state.attribut = null
  state.value = []
  state.search_values = {}
  state.match = true
  state.actions = null
  state.summary = null
  state.limit = 100

  ipcRenderer.on('count', (e, c) => {
    state.current = c
    state.pagination = renderPaginationList(c, state.limit)
    emitter.emit('render')
  })

  ipcRenderer.on('files_imported', (e, {current, total}) => {
    state.current_imported = current
    state.total_imported = total
    emitter.emit('render')
  })

  ipcRenderer.on('sourceEnumLoaded', (e, sourceEnum) => {
    state.sourceTypes = sourceEnum
  })

  ipcRenderer.on('schoolsLoadedForChange', (e, {schools, sources, mapsResults}) => {
    state.mapsResults = mapsResults
    state.schools = schools
    state.sources = sources
    state.similarity = schools.length === 2 && compareSchools(schools[0], schools[1])
    state.merge = schools.length >= 2
    emitter.emit('pushState', '#change')
    setTimeout(initMaps, 1000) // TODO nicht gut. müsste in eine Art onload vom changeView gelagert werden.
  })

  function initMaps () {
    state.mapsResults.forEach((element, index) => {
      initMap({lat: element.lat, lng: element.lng}, `map${index}`)
    })
  }

  function initMap (pos, htmlId) {
    GoogleMapsLoader.load(function (google) {
      const map = new google.maps.Map(document.getElementById(htmlId), {
        zoom: 17,
        center: pos
      })
      /* eslint no-unused-vars: ["error", { "vars": "local", "varsIgnorePattern": "marker", "args": "none" }] */
      const marker = new google.maps.Marker({
        position: pos,
        map: map
      })
    })
  }

  ipcRenderer.on('similarSchoolsLoaded', (e, {inputSchool, similarSchools, similarities}) => {
    state.similar = {inputSchool, similarSchools, similarities}
    emitter.emit('pushState', '#similar')
  })

  ipcRenderer.on('schoolsChanged', (e) => {
    emitter.emit('pushState', '#')
    $(window).scrollTop(0)
  })

  ipcRenderer.on('fetchData', (e, data) => {
    if (data.result) {
      state.error = ''
      state.eler = data.result.rows
      state.pagination = renderPaginationList(data.result.count, state.limit)
      state.datasource = data.source
      emitter.emit('render')

      if (state.href.substr(state.href.lastIndexOf('/') + 1) === 'show') {
        emitter.emit('render')
      } else {
        emitter.emit('pushState', '#show')
        $(window).scrollTop(0)
      }
    }
  })

  ipcRenderer.on('schoolDeleted', e => {
    ipcRenderer.send('fetchData', {offset: state.offset, order: state.sorting, searchValues: state.search_values, limit: state.limit})
  })

  ipcRenderer.on('showSummary', (e, summary) => {
    state.summary = summary
    if (state.href.substr(state.href.lastIndexOf('/') + 1) === 'summary') {
      $('body').removeClass('loading')

      emitter.emit('render')
    } else {
      $('body').removeClass('loading')
      emitter.emit('pushState', '#summary')
    }
  })

  ipcRenderer.on('matchesFound', (e, matches) => {
    state.matches = matches

    emitter.emit('render')
  })

  ipcRenderer.on('actionsLoaded', (e, actions) => {
    state.actions = actions
    emitter.emit('render')
  })

  ipcRenderer.on('invalidateActions', () => {
    state.actions = null
    emitter.emit('render')
  })

  ipcRenderer.on('summaryLoaded', (e, summary) => {
    state.summary = summary
    emitter.emit('render')
  })

  ipcRenderer.on('invalidateSummary', () => {
    state.summary = null
    emitter.emit('render')
  })

  ipcRenderer.on('historyLoaded', (e, history) => {
    state.history = history
    emitter.emit('pushState', '#history')
  })

  ipcRenderer.on('errorChannel', (e, message) => {
    $('body').removeClass('loading')
    window.alert(message)
  })
  ipcRenderer.on('dontMergeDone', () => {
    emitter.emit('pushState', '#')
  })

  ipcRenderer.on('dontMerge', (e, {schools, dontMerges, mapsResults}) => {
    function dontMergeMapper (dontMerge) {
      return html`
        <p>
          <strong>${schools.filter(school => school.id === dontMerge.id1)[0].title}</strong>
           &
          <strong>${schools.filter(school => school.id === dontMerge.id2)[0].title}</strong>
          :
          ${dontMerge.comment}
        </p>
      `
    }
    function ignoreDontMerge () {
      ipcRenderer.send('ignoreDontMerge', {schools, dontMerges, mapsResults})
    }
    function cancelMerge () {
      $('body').removeClass('loading')
    }
    $(html`
      <div class="modal" role="dialog">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Schools marked with "dont merge"</h5>
            </div>
            <div class="modal-body">
              <p>The following schools are marked with "dont merge" with the following comments:</p>
              ${dontMerges.map(dontMergeMapper)}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" data-dismiss="modal" onclick=${ignoreDontMerge}>Delete "dont merge" and continue</button>
              <button type="button" class="btn btn-secondary" data-dismiss="modal" onclick=${cancelMerge}>Dont merge and cancel</button>
            </div>
          </div>
        </div>
      </div>
    `).modal()
  })
}

/**
 *
 * @param {type} total data count
 * @param {type} limit
 * @returns {Array|renderPaginationList.result}
 */
var renderPaginationList = (total, limit) => {
  var c = total / limit
  var result = []
  for (var i = 0; i < c; i++) {
    result.push(i)
  }
  return result
}
