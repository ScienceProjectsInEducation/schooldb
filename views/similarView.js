const html = require('choo/html')
const navbar = require('./navbar')
const {ipcRenderer} = require('electron')

module.exports = function (state, emit) {
  return html`
    <body>
      ${navbar(emit)}
      <div class="card">
        <div class="card-header">
          <h1>Similar schools</h1>
        </div>
        <div class="card-body">
          <table class="table table-sm table-striped table-bordered">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Street</th>
                <th scope="col">Postalcode</th>
                <th scope="col">City</th>
                <th scope="col">State</th>
                <th scope="col">Similarity</th>
              </tr>
            </thead>
            <tbody>
              ${mapper(state.similar.inputSchool)}
              ${state.similar.similarSchools.map(mapper)}
            </tbody>
          </table>
        </div>
      </div>
    </body>
  `

  function merge (index) {
    if (index === -1) {
      ipcRenderer.send('loadSchoolsForChange', [state.similar.inputSchool.id])
    } else {
      ipcRenderer.send('loadSchoolsForChange', [state.similar.inputSchool.id, state.similar.similarSchools[index].id])
    }
  }

  function mapper (school, index = -1) {
    const similarity = (index === -1) ? '1' : state.similar.similarities[index]
    const sim = Math.round(similarity * 100)
    const style = (index === -1) ? 'font-weight:bold;' : ''
    return html`
      <tr>
        <td onclick=${() => merge(index)} class="hover" style="${style}">${school.title}</td>
        <td style="${style}">${school.street}</td>
        <td style="${style}">${school.postalcode}</td>
        <td style="${style}">${school.city}</td>
        <td style="${style}">${school.state}</td>
        <td style="${style}">${index === -1 ? 'Selection' : `${sim}%`}</td>
      </tr>
    `
  }
}
