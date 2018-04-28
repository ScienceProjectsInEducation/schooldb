const html = require('choo/html')

module.exports = function schoolInfo (school) {
  return html`
    <div id="ModalLoginForm" class="modal fade">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title"><b>School: </b> ${school.title}</h1>
            </div>
            <div class="modal-body">
                <form role="form" method="POST" action="">
                    <input type="hidden" name="_token" value="">
                    <div class="form-group">
                        <label class="control-label"><b>ID:</b> ${school.id}</label>

                    </div>
                    <div class="form-group">
                        <label class="control-label"><b>Title:</b> ${school.title}</label>

                    </div>
                    <div class="form-group">
                        <label class="control-label"><b>Street:</b> ${school.street}</label>

                    </div>
                    <div class="form-group">
                        <label class="control-label"><b>House Number:</b> ${school.house_nr}</label>

                    </div>
                    <div class="form-group">
                        <label class="control-label"><b>Postalcode:</b> ${school.postalcode}</label>

                    </div>
                    <div class="form-group">
                        <label class="control-label"><b>State:</b> ${school.state}</label>

                    </div>
                    <div class="form-group">
                        <label class="control-label"><b>Telephone:</b> ${school.telephone}</label>

                    </div>
                    <div class="form-group">
                        <label class="control-label"><b>Email:</b> ${school.email}</label>

                    </div>

                    <div class="form-group">
                        <label class="control-label"><b>Type:</b> ${school.type}</label>

                    </div>

                    <div class="form-group">
                        <div>
                            <button type="submit" class="btn btn-secondary" data-dismiss="modal">Back</button>



                        </div>
                    </div>
                </form>

            </div>
        </div>
    </div>
</div>`
}
