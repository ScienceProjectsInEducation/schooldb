const electron = require('electron')
const html = require('choo/html')
const navbar = require('./navbar')
const $ = require('jquery')
const {ipcRenderer} = electron

module.exports = function (state, emit) {
  return html`
    <body>
      ${navbar(emit)}
      <div class="card" id="matchfinderView">
        <div class="card-header">
          <h1>Matchfinder</h1>
        </div>
        <div class="card-body">
          <form id="id-input-edit" onsubmit=${findMatches}>
            <label for="from">From ID</label>
            <input type="text" id="from" name="from" required patttern="[0-9]+">
            <label for="to">To ID</label>
            <input type="text" id="to" name="to" required patttern="[0-9]+">
            <label for="m">Show top ... matches</label>
            <input type="text" id="m" name="m" required patttern="[0-9]+">
            <input type="submit" value="Find Matches" class="btn btn-primary">
          </form>
        </div>
        <div class="card-body">
          <div class="card">
            <div class="card-header">
              <h2>Results</h2>
            </div>
            <div class="card-body">
              ${(state.matches != null) ? state.matches.map(match => renderMatches(match)) : notYet()}
            </div>
          </div>
        </div>
      </div><div class="wait"></div>
    </body>
  `

  function findMatches (event) {
    $('body').addClass('loading')
    event.preventDefault()

    var form = event.currentTarget
    var data = new window.FormData(form)
    const from = parseInt(data.get('from'))
    const to = parseInt(data.get('to'))
    const m = parseInt(data.get('m'))

    if (from >= to) {
      $(html`
        <div class="modal" role="dialog">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Bad ID's</h5>
              </div>
              <div class="modal-body">
                <p>Entered ID's are not okay.</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Alright :(</button>
              </div>
            </div>
          </div>
        </div>
      `).modal()
      return
    }

    ipcRenderer.send('findMatches', {from, to, m})
  }

  function notYet () {
    return html`
      <p>No results yet</p>
    `
  }

  function renderMatches (match) {
    return html`
      <p>
        ${match.value} - ${match.title[0]} / ${match.title[1]} <button onclick=${() => showMergeForMatch(match)} class="btn btn-primary">Merge</button>
      </p>
    `
  }

  function showMergeForMatch (match) {
    const i = parseInt(match.schools.i)
    const j = parseInt(match.schools.j)

    ipcRenderer.send('loadSchoolsForChange', [i, j])
  }
}
