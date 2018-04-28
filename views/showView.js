const electron = require('electron')
const html = require('choo/html')
const navbar = require('./navbar')
const ShowInfoModal = require('./schoolInfo')
var Tabheader = require('../views/tableheaderView')
var newheader = new Tabheader()
var MergeComponent = require('../views/merge_div_component')
var mergediv = new MergeComponent()
const {ipcRenderer} = electron
const $ = require('jquery')

module.exports = function (state, emit) {
  return html`
    <body>
      ${navbar(emit)}

      <div class="card" id="showView">
        <div  class="card-body">

<div class="pull-right">
  ${mergediv.render(state)}
  </div>


<br>
<hr>
<p>
<input style="padding: 0 0.3em" type="submit" name="navig" class="ajax" value="<<" onclick=${() => changeOffset(0)} title="first page">
<input style="padding: 0 0.3em" type="submit" name="navig" class="ajax" value="<" onclick=${() => changeOffset(state.offset - 1)} title="previous page">
<select style="padding: 0 0.3em" class="pageselector ajax" name="pos" onchange=${onchange}>

${state.pagination.map((page) => {
    if (page === state.offset) {
      return html`<option selected>${page}</option>`
    } else {
      return html`<option >${page}</option>`
    }
  })}

</select>

 <input style="padding: 0 0.3em" type="submit" name="navig" class="ajax" value=">" onclick=${() => changeOffset(state.offset + 1)} title="next page">
 <input style="padding: 0 0.3em" type="submit" name="navig" class="ajax" value=">>" onclick=${() => changeOffset(state.pagination[state.pagination.length - 1])} title="last page">

 Number of rows: <select name="session_max_rows" onchange=${changeRowAmount} class="autosubmit">
 ${[25, 50, 100, 250].map(amount => {
    if (amount === state.limit) {
      return html`<option selected>${amount}</option>`
    } else {
      return html`<option>${amount}</option>`
    }
  })}
 </select>
 </p>
 <p style="display:inline-block;">Sorting: ${state.sorting.map((s, i) => `${i}.: ${s[0]} ${s[1]};`)}</p>
 <button onclick="${undoSorting}" class="btn btn-danger">Cancel sorting</button>

<div hidden="hidden" class="wait lds-css">
<div style="width:100%;height:100%" class="lds-eclipse">
<div>

</div> </div>
<style type="text/css"></style>
</div>
<table id="data" class="table table-inbox table-hover">
<tbody class="text-center">
<tr>
<th><b>Select for merge</b></th>
<th style="width: 7em"><b>Action</b></th>
<th><b>Id</b><a class="fa fa-fw fa-sort hover" onclick=${() => sort('id')} ></a></th>
<th><b>Name</b><a class="fa fa-fw fa-sort hover" onclick=${() => sort('title')} ></a></th>
<th><b>Street</b><a class="fa fa-fw fa-sort hover" onclick=${() => sort('street')} ></a></th>
<th><b>House Nr</b><a class="fa fa-fw fa-sort hover" onclick=${() => sort('house_nr')} ></a></th>
<th><b>ZIP</b><a class="fa fa-fw fa-sort hover" onclick=${() => sort('postalcode')} ></a></th>
<th><b>State</b><a class="fa fa-fw fa-sort hover" onclick=${() => sort('state')} ></a></th>
<th><b>Country</b><a class="fa fa-fw fa-sort hover" onclick=${() => sort('country')} ></a></th>
<th><b>Type School</b><a class="fa fa-fw fa-sort hover" onclick=${() => sort('type')} ></a></th>
</tr>

${newheader.render(state)}

</tbody>

<tbody id="data-table">

${state.eler.map((page) => html`
<tr class="odd hover marked">

<td class="text-center">

<input id="check${page.dataValues.id}" onchange=${(e) => AddSchooltoMerge(e, page.dataValues, state)} type="checkbox" name="myTextEditBox"
      style="margin-left:auto; margin-right:auto;"  ${checkId(page.dataValues.id) ? (
    'checked'
  ) : (
    ''
  )}>

 </td>

 <td>
<span class="btn-group pull-right" style="margin-top: 5px">
<button onclick=${() => showSimiliarTOmergeModal(page.dataValues)} data-toggle="modal" data-target="#item_merge" class="btn btn-success btn-xs"><em class="fa fa-random"></em></button>

<button class="btn btn-warning btn-xs" data-toggle="modal" data-target= "#item_edit" onclick=${() => ShoweditSchoolForm(page.dataValues.id)} ><em class="fa fa-pencil"></em></button>
<button class="btn btn-danger btn-xs" data-toggle="modal" data-target="#item_remove" onclick=${() => ShowDeleteSchoolForm(page.dataValues.title, page.dataValues.id)}><em class="fa fa-trash"></em></button>
<button class="btn btn-xs" onclick=${() => showHistory(page.dataValues.id)}><em class="fa fa-list"></em></button>
</span></td>

<td onclick=${() => ShowInfoSchoolForm(page.dataValues.id)}>${page.dataValues.id}</td>
<td onclick=${() => ShowInfoSchoolForm(page.dataValues.id)}>${page.dataValues.title}</td>
<td onclick=${() => ShowInfoSchoolForm(page.dataValues.id)}>${page.dataValues.street}</td>
<td onclick=${() => ShowInfoSchoolForm(page.dataValues.id)}>${page.dataValues.house_nr}</td>
<td onclick=${() => ShowInfoSchoolForm(page.dataValues.id)}>${page.dataValues.postalcode}</td>
<td onclick=${() => ShowInfoSchoolForm(page.dataValues.id)}>${page.dataValues.state}</td>
<td onclick=${() => ShowInfoSchoolForm(page.dataValues.id)}>${page.dataValues.country}</td>
<td onclick=${() => ShowInfoSchoolForm(page.dataValues.id)}>${page.dataValues.type}</td>

</tr>`)}

   </tbody></table></div> <div class="wait"></div></body> `

  function sort (column) {
    const ind = state.sorting.map(s => s[0]).indexOf(column)
    $('body').addClass('loading')
    if (ind !== -1) {
      // falls wir schon nach dieser spalte sortieren
      if (state.sorting[ind][1] === 'ASC') {
        // falls wir aufsteigend sortieren
        state.sorting[ind][1] = 'DESC' // sortiere absteigend
      } else {
        // falls wir absteigend sortieren
        if (state.sorting.length === 1) {
          // falls wir nach nichts anderem sortieren
          state.sorting[ind][1] = 'ASC' // sortiere aufsteigend
        } else {
          // falls wir zusätzlich nach anderem sortieren
          // lösche diese spalte aus der sortierung
          state.sorting = state.sorting.filter((value, i) => ind !== i)
        }
      }
    } else {
      // falls wir noch nicht nach dieser spalte sortieren
      // sortiere nach dieser spalte aufsteigend mit geringster wichtigkeit
      state.sorting.push([column, 'ASC'])
    }
    ipcRenderer.send('fetchData', {offset: state.offset, order: state.sorting, searchValues: state.search_values, limit: state.limit})
  }

  /**
 *
 * @param {type} id
 * @returns {Boolean}
 * check if the school_id already exist and ready to merge :
 */
  function checkId (id) {
    for (let i = 0; i < state.schooltomerge.length; i++) {
      if (state.schooltomerge[i].id === id) { return true }
    }
    return false
  }

  function undoSorting () {
    $('body').addClass('loading')
    state.sorting = [
      ['id', 'ASC']
    ]
    ipcRenderer.send('fetchData', {offset: state.offset, order: state.sorting, searchValues: state.search_values, limit: state.limit})
  }

  function onchange (e) {
    $('body').addClass('loading')

    e.preventDefault()

    state.offset = parseInt(e.target.value)

    ipcRenderer.send('fetchData', {offset: state.offset, order: state.sorting, searchValues: state.search_values, limit: state.limit})
  }

  function changeRowAmount (e) {
    $('body').addClass('loading')

    e.preventDefault()

    state.offset = 0 // set offset to 0 because we are changing page size. we could also calculate a new offset but this is simpler
    // changing the offset is important, because there can be errors. e.g.: we are on page 8 from 10 with page size 50. setting
    // page size to 100 decreses the total amount of pages to 5. we can not be on page 8 anymore!
    state.limit = parseInt(e.target.value)

    ipcRenderer.send('fetchData', {offset: state.offset, order: state.sorting, searchValues: state.search_values, limit: state.limit})
  }

  function changeOffset (offset) {
    if (offset < 0 || offset > state.pagination[state.pagination.length - 1]) {
      return
    }
    state.offset = offset
    $('body').addClass('loading')
    ipcRenderer.send('fetchData', {offset: state.offset, order: state.sorting, searchValues: state.search_values, limit: state.limit})
  }
}

function ShoweditSchoolForm (schoolid) {
  ipcRenderer.send('loadSchoolsForChange', [schoolid])
}
function showHistory (schoolid) {
  ipcRenderer.send('fetchHistory', {id: schoolid})
}
/**
 * show popup asking the user wants to delete this school
 * @param {type} schoolid
 * @returns {undefined}show
 */
function ShowDeleteSchoolForm (title, id) {
  $(DeleteModal(title, id)).modal()
}
function ShowInfoSchoolForm (schoolid) {
  let school = (ipcRenderer.sendSync('getSchoolbyID', schoolid))
  console.log(school)
  $(ShowInfoModal(school)).modal()
}

function DeleteModal (title, id) {
  function deleteSchool (id) {
    $('body').addClass('loading')
    ipcRenderer.send('deleteSchool', id)
  }
  return html`
    <div id="ModalExample" class="modal">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">Please confirm deletion of this school</h4>
                </div>
                <div class="modal-body">
                    <p>${title}</p>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-danger" data-dismiss="modal" onclick=${() => deleteSchool(id)}>confirm deletion</button>
                  <button type="button" class="btn btn-secondary" data-dismiss="modal">cancel</button>
                </div>
            </div>
        </div>
    </div>
  `
}

function AddSchooltoMerge (e, school, state) {
  if (e.target.checked) {
    $.notifyDefaults({
      type: 'success',
      allow_dismiss: false
    })
    $.notify('School added to merge selection')
    setTimeout(function () {
      $.notifyClose()
    }, 1500)
    state.schooltomerge.push(school)
    mergediv.rerender()
  } else {
    $.notify({

      message: 'School removed from merge selection'
    }, {
      type: 'danger'
    })
    setTimeout(function () {
      $.notifyClose()
    }, 1500)
    mergediv.DeleteSchoolfromMergedList(school.id, state, e)
    mergediv.rerender()
  }
}

function SimiliarTOmergeModal (school) {
  return html`<div class="modal fade" id="exampleModalCenter" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLongTitle">Find similar schools</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">X</span>
        </button>
      </div>
      <div class="modal-body">
  <h3>  <b>School :</b>  ${school.title} </h3>

       <form class="form-inline" role="form">
    <input hidden value="${school.id}"/>

     <div class="row form-group">
      <div class="col-lg-6 col-md-6 col-xs-12">
       <label> Amount of similar schools to find:  </label>
      </div>
     <div class="col-lg-3 col-md-3 col-xs-12">
      <input type="number" class="form-control" id="Similaritynumber" value="10"/>
      </div>
    </div>


      </div>
      <div class="modal-footer">
        <input onclick=${(e) => showSimilarity(e, school.id)} data-dismiss="modal" value="Find"  type="submit" class="btn btn-success"/>
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>

       </form>
      </div>
    </div>
  </div>
</div>`
}

function showSimiliarTOmergeModal (school) {
  $(SimiliarTOmergeModal(school)).modal()
}

function showSimilarity (e, schoolid) {
  var number = e.target.parentNode.parentNode.children[1].childNodes[1].childNodes[1].childNodes['0'].value
  $('body').addClass('loading')
  $(e).hide()
  ipcRenderer.send('getMostSimilarSchools', {id: schoolid, amount: number})
}
