const html = require('choo/html')
const electron = require('electron')
const navbar = require('./navbar')
const {ipcRenderer} = electron
const $ = require('jquery')

module.exports = function (state, emit) {
  var bodyClass = ''
  if (state.actions === null) {
    bodyClass = 'loading'
    ipcRenderer.send('loadActions')
  }

  return html`
    <body class="${bodyClass}">
      ${navbar(emit)}
      <div class="card" id="actionsView">
        <div class="card-header">
          <h1>Actions</h1>
        </div>
        <div class="card-body">
          <table class="table table-sm table-striped table-bordered">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Action</th>
                <th scope="col">Number of affected schools</th>
                <th scope="col">Undo</th>
              </tr>
            </thead>>
            <tbody>
              ${state.actions !== null ? state.actions.map(mapper) : ''}
            </tbody>
          </table>
        </div>
        <div class="wait"></div>
      </div>
    </body>
  `

  function mapper (action) {
    return html`
      <tr>
        <td>${action['createdAt']}</td>
        <td>import</td>
        <td>${action['cnt']}</td>
        <td>
          <button onclick=${() => undoAction(action['id'])} class="btn btn-danger btn-xd">
            <em class="fa fa-undo"></em>
          </button>
        </td>
      </tr>
    `
  }

  function undoAction (actionId) {
    $('body').addClass('loading')
    ipcRenderer.send('undoAction', actionId)
  }
}
