var Nanocomponent = require('nanocomponent')
const electron = require('electron')
const html = require('choo/html')
const {ipcRenderer} = electron
const $ = require('jquery')

const liveSearchTimeGap = 1000
let liveSearchTimer

class head extends Nanocomponent {
  createElement (state) {
    return html`

<tr>
<td>
</td>


  <td><form>
 <div class="input-group stylish-input-group">

                    <span class="input-group-addon">

                    </span>
          </div>

  </form></td>
       <td>
 <div class="input-group stylish-input-group">
                         <input  class="form-control filter-input" name="id" oninput=${(e) => this.liveSearch(state, e)} type="text"  placeholder="ID" id="title" value="${state.search_values['id'] ? state.search_values['id'] : ''}" required>

          </div>
  </td>
       <td>
 <div class="input-group stylish-input-group">
                         <input  class="form-control filter-input" oninput=${(e) => this.liveSearch(state, e)} name="title" value="${state.search_values['title'] ? state.search_values['title'] : ''}"  type="text" placeholder="Title" required>

          </div>
 </td>
     <td>
 <div class="input-group stylish-input-group">
                         <input  class="form-control filter-input" oninput=${(e) => this.liveSearch(state, e)} name="street" value="${state.search_values['street'] ? state.search_values['street'] : ''}" type="text" placeholder="Street" required>

          </div>
  </td>
      <td>
 <div class="input-group stylish-input-group">
                         <input class="form-control filter-input" oninput=${(e) => this.liveSearch(state, e)} name="house_nr" value="${state.search_values['house_nr'] ? state.search_values['house_nr'] : ''}" type="text" placeholder="Nr" required>

          </div>

  </td>
       <td>
 <div class="input-group stylish-input-group">
                         <input class="form-control filter-input" oninput=${(e) => this.liveSearch(state, e)} name="postalcode" value="${state.search_values['postalcode'] ? state.search_values['postalcode'] : ''}" type="text" placeholder="Postal code" required>

          </div>

  </td>
        <td>
 <div class="input-group stylish-input-group">
                         <input  class="form-control filter-input" oninput=${(e) => this.liveSearch(state, e)} name="state" value="${state.search_values['state'] ? state.search_values['state'] : ''}"  type="text"  placeholder="State" required>

          </div>

 </td>
  <td>
 <div class="input-group stylish-input-group">
                         <input  class="form-control filter-input" oninput=${(e) => this.liveSearch(state, e)} name="country" type="text" value="${state.search_values['country'] ? state.search_values['country'] : ''}" placeholder="Country" required>

          </div>

  </td>
   <td>
 <div class="input-group stylish-input-group">
                         <input  class="form-control filter-input"  oninput=${(e) => this.liveSearch(state, e)} name="type" value="${state.search_values['type'] ? state.search_values['type'] : ''}" type="text" placeholder="Type" required>

          </div>

</td>


      </tr>

    `
  }

  // Implement conditional rendering
  setListener () {

  }

  liveSearch (state, event) {
    var value = event.target.value
    var attribut = event.target.name
    if (value) {
      // save all fields as key => value array
      /* for example , if we are searching for schools where bundeland is berlin and land is Deutschland
 * our state.search_values will contain two object :{ "land" : "Deutschland" },{"bundesland":"berlin"}
 */
      state.search_values[attribut] = value
    } else {
    // if you deleting some input value ,  this will be also removed from the state.search_values

      delete state.search_values[attribut]
    }
    function liveSearchGetData () {
      $('body').addClass('loading')
      state.offset = 0
      ipcRenderer.send('fetchData', {offset: state.offset, order: state.sorting, searchValues: state.search_values, limit: state.limit})
    }

    clearTimeout(liveSearchTimer)

    liveSearchTimer = setTimeout(liveSearchGetData, liveSearchTimeGap)
  }

  update (state) {

  }
}

module.exports = head
