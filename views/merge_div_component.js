
const electron = require('electron')
const $ = require('jquery')
const {ipcRenderer} = electron
var Nanocomponent = require('nanocomponent')
const html = require('choo/html')

class MergeComponent extends Nanocomponent {
  createElement (state) {
    return html`
<div class="card">
    <h6 class="card-header">
        <a data-toggle="collapse" href="#collapse-example" aria-expanded="false" aria-controls="collapse-example" id="heading-example" class="d-block">
            <i class="fa fa-chevron-down pull-right"></i>
           
            Amount of schools to merge: <span id="schooltomergenumber"> ${state.schooltomerge.length} </span>
        </a>
    </h6>
    <div  id="collapse-example" class="collapse" aria-labelledby="heading-example">
        <div class="card-body">
 <ul class="list-group">
 ${state.schooltomerge.map((school) => html`
  <li id=${school.id} class="list-group-item">${school.title}<button class="float-sm-right" data-target="#item_remove" onclick=${(e) => this.DeleteSchoolfromMergedList(school.id, state, e)}><em class="fa fa-trash"></em></button></li>`)}
   <button onclick=${() => this.mergeSchool(state)}  class="btn btn-primary btn-sm" data-dismiss="modal" aria-hidden="true">Merge</button>
</ul>







        </div>
        <div class="wait"></div>
    </div>

</div>`
  }

  DeleteSchoolfromMergedList (id, state, e) {
    // delete the school from the state.schooltomerge object
    state.schooltomerge = state.schooltomerge.filter((school) => {
      return school.id !== id
    })
    $.notify({

      message: 'School removed from merge selection'
    }, {
      type: 'danger'
    })
    setTimeout(function () {
      $.notifyClose()
    }, 1500)
    // jquery used here to remove the element from the Dom
    $('#' + id).remove()
    // uncheck the checkbox
    document.getElementById('check' + id).checked = false

    $('#schooltomergenumber').text(state.schooltomerge.length)
  }

  // Implement conditional rendering
  setListener () {

  }
  update () {
  }

  mergeSchool (state) {
    if (state.schooltomerge.length > 0) {
      $('body').addClass('loading')
      var ids = []
      // save all ids in a ids array //
      state.schooltomerge.map((school) => ids.push(school.id))
      ipcRenderer.send('loadSchoolsForChange', ids)
    } else {
      window.alert('No schools selected to merge')
    }
  }
}
module.exports = MergeComponent
