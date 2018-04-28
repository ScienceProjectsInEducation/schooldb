const electron = require('electron')
const html = require('choo/html')
const navbar = require('./navbar')
const _ = require('lodash')
const {ipcRenderer} = electron
const {mysteriousValue} = require('../lib/mysteriousValue')
const $ = require('jquery')
const changeProperties = require('../lib/changeProperties')

const GOOGLE_MAPS_SOURCE_ID = 4
const EXISTING_DATA_SOURCE_ID = 1

module.exports = function (state, emit) {
  function createSingleIdCell (school) {
    return html`
      <td>${school['id']}</td>
    `
  }

  function createSingleMapCell (index) {
    return html`
      <td>
        <div id="map${index}" class="gmap"></div>
      </td>
    `
  }

  const dontMergeButton = state.schools.length === 2
    ? html`<button type="button" class="btn btn-primary" onclick=${dontMergeModal}>Mark "dont merge"</button>`
    : ''

  const type = state.merge ? 'confirm merge' : 'confirm edit'

  return html`
    <body>
      ${navbar(emit)}
      <div class="card" id="changeView">
        <div class="card-header">
          <h1>${state.merge ? 'Merge' : 'Edit'}</h1>
          ${state.similarity ? html`<h2>Similarity: ${Math.round(state.similarity * 100)}%</h2>` : ''}
        </div>
        <div class="card-body">
          <form onsubmit=${onSubmitInput}>
            <table class="table table-sm table-striped table-bordered">
              <tbody>
                <tr>
                  <th scope="row">ID</th>
                  ${state.schools.map(school => createSingleIdCell(school))}
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <th scope="row">Map</th>
                  ${state.schools.map((school, index) => createSingleMapCell(index))}
                  <td></td>
                  <td></td>
                </tr>
                ${changeProperties.map(key => singleFormRow(key))}
              </tbody>
            </table>
            <button type="submit" class="btn btn-success">${type}</button>
            ${dontMergeButton}
            <button type="button" class="btn btn-secondary" onclick=${cancel}>Cancel</button>
          </form>
        </div>
        <div class="wait"></div>
      </div>
    </body>
  `

  function cancel () {
    emit('pushState', '#')
    $(window).scrollTop(0)
  }

  function dontMergeModal () {
    $(html`
      <div class="modal" role="dialog" id="dontMergeModal">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Dont merge</h5>
            </div>
            <div class="modal-body">
              <form onsubmit=${dontMerge}>
                <label for="comment">Please describe why these schools cannot be merged.</label>
                <input type="text" name="comment" class="form-control">
                <button type="submit" class="btn btn-primary">Confirm</button>
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `).modal()
  }

  function dontMerge (event) {
    $('dontMergeModal').modal('hide')
    $('body').addClass('loading')
    event.preventDefault()
    var form = event.currentTarget
    var data = new window.FormData(form)
    const comment = data.get('comment')
    const sourceSchoolIds = state.schools.map(school => school.id)
    ipcRenderer.send('dontMerge', {sourceSchoolIds, comment})
  }

  function onSubmitInput (event) {
    event.preventDefault()
    var form = event.currentTarget
    var data = new window.FormData(form)

    if (state.schools.length === 2 && state.similarity <= mysteriousValue) {
      $(html`
        <div class="modal" role="dialog">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Confirm merge</h5>
              </div>
              <div class="modal-body">
                <p>Please confirm to merge these schools.</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary" data-dismiss="modal" onclick=${() => change(data)}>Confirm</button>
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      `).modal()
      return
    }

    change(data)
  }

  function change (data) {
    $('body').addClass('loading')
    const newSchool = {}
    const sources = changeProperties.map(property => {
      const key = Number(data.get(property))
      if (key === -1) {
        // Freetext data
        newSchool[property] = data.get(property + '-freetext')
        return {
          property,
          sourceType: $(`#${property}-source`).val()
        }
      } else {
        const school = state.schools[key]
        newSchool[property] = school[property]
        return { // TODO: Just take the source from the school
          property,
          schoolId: school.id
        }
      }
    })

    const sourceSchoolIds = state.schools.map(school => school.id)

    ipcRenderer.send('changeSchools', {newSchool, sourceSchoolIds, sources})
  }

  function singleFormRow (key) {
    function mapper (school, ind) {
      const source = state.sources[ind]
      function onGoogleClick () {
        Object.keys(state.mapsResults[ind]).forEach(mapsResultsKey => {
          const val = state.mapsResults[ind][mapsResultsKey] === null ? '' : state.mapsResults[ind][mapsResultsKey]
          $(`#${mapsResultsKey}-freetext`).val(val)
          $(`#${mapsResultsKey}--1`).prop('checked', state.mapsResults[ind][mapsResultsKey])
          if (val !== '') {
            $(`#${mapsResultsKey}-source`).val(GOOGLE_MAPS_SOURCE_ID)
          }
        })
      }
      const googleButton = key === 'title' ? html`
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
          style="width:15px;height:15px;margin-left:5px;"
          onclick=${onGoogleClick}
          title="${state.mapsResults[ind].formatted_address}"
          />
      ` : ''

      const sourceTypeId = _.get(source, [key, 'type']) || EXISTING_DATA_SOURCE_ID
      console.log({sourceTypeId})
      console.log(state.sourceTypes)
      const sourceLabel = state.sourceTypes.find(type => type.id === sourceTypeId).title

      return html`
        <td>
          <div class="form-check">
            <input type="radio" required id="${key}-${ind}" name="${key}" value="${ind}" class="form-check-input" ${ind === 0 ? 'checked' : ''}>
            <label for="${key}-${ind}" class="form-check-label">${school[key]}<br/>(${sourceLabel})</label>
            ${googleButton}
          </div>
        </td>`
    }
    function sourceEnumMapper (sourceEnum) {
      return html`
        <option value="${sourceEnum.id}">${sourceEnum.title}</option>
      `
    }
    return html`
    <tr>
      <th scope="row">${key}</th>
      ${state.schools.map((school, ind) => mapper(school, ind))}
      <td>
        <div class="form-check">
          <input type="radio" required id="${key}--1" name="${key}" value="-1" class="form-check-input">
          <input oninput=${setselectedRadio} type="text" id="${key}-freetext" name="${key}-freetext" class="form-control">
        </div>
      </td>
      <td>
        <select class="form-control" id="${key}-source">
          ${state.sourceTypes.map(sourceEnumMapper)}
        </select>
      </td>
    </tr>
    `
  }
  function setselectedRadio (e) {
    e.target.previousSibling.checked = true
  }
}
