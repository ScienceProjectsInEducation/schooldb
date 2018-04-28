const electron = require('electron')
const html = require('choo/html')
const navbar = require('./navbar')
const {ipcRenderer} = electron
const $ = require('jquery')

module.exports = function (state, emit) {
  return html`
    <body>
      ${navbar(emit)}
      <div class="card" id="mainView">
        <div class="card-header">
          <h1>currently ${state.current} schools</h1>
        </div>
        <div class="card-body">
          <div class="card-group">
            <div class="card">
              <div class="card-header">
                <h2>Merge</h2>
              </div>
              <div class="card-body">
                <form onsubmit=${onMergeSubmitIdInput}>
                  <label for="id1">ID1</label>
                  <input class="form-control" type="text" id="id1" name="id1" required pattern="[0-9]+">
                  <label for="id2">ID2</label>
                  <input class="form-control" type="text" id="id2" name="id2" required pattern="[0-9]+">
                  <input type="submit" value="open merge" class="btn btn-primary">
                </form>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <h2>Edit</h2>
              </div>
              <div class="card-body">
                <form onsubmit=${onEditSubmitIdInput}>
                  <label for="id">ID</label>
                  <input class="form-control" type="text" id="id" name="id" required patttern="[0-9]+">
                  <input type="submit" value="open edit" class="btn btn-primary">
                </form>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <h2>Similar School</h2>
              </div>
              <div class="card-body">
                <form onsubmit=${onSimilarIdInput}>
                  <label for="id">ID</label>
                  <input class="form-control" type="text" id="id" name="id" required pattern="[0-9]+">
                  <input type="submit" value="find similar" class="btn btn-primary">
                </form>
              </div>
            </div>
            <div class="wait"></div>
          </div>
        </div>
        Importing ${state.current_imported}/${state.total_imported}
      </div>
    </body>
  `

  function onEditSubmitIdInput (event) {
    event.preventDefault()
    $('body').addClass('loading')
    var form = event.currentTarget
    var data = new window.FormData(form)
    const id = data.get('id')
    ipcRenderer.send('loadSchoolsForChange', [id])
  }

  function onMergeSubmitIdInput (event) {
    event.preventDefault()
    $('body').addClass('loading')
    var form = event.currentTarget
    var data = new window.FormData(form)
    const id1 = data.get('id1')
    const id2 = data.get('id2')
    ipcRenderer.send('loadSchoolsForChange', [parseInt(id1), parseInt(id2)])
  }

  function onSimilarIdInput (event) {
    $('body').addClass('loading')
    event.preventDefault()

    var form = event.currentTarget
    var data = new window.FormData(form)
    const id = data.get('id')

    ipcRenderer.send('getMostSimilarSchools', {id: id, amount: 10})
  }
}
