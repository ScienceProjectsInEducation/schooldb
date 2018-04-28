const html = require('choo/html')
const electron = require('electron')
const {ipcRenderer} = electron
const $ = require('jquery')
module.exports = function (emit) {
  return html`
    <nav class="navbar fixed-top navbar-expand-lg navbar-light bg-light">
        <a class="navbar-brand" href="#" onclick=${() => { ipcRenderer.send('invalidateSummary'); $(window).scrollTop(0) }}><b>Schools Database</b></a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNavDropdown">
            <ul class="navbar-nav">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Import
                    </a>
                    <div class="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                        <a class="dropdown-item" onclick=${() => ipcRenderer.send('csv', {action: 'import', type: 'abi'})} href="">Abiturpreis Mathe</a>
                        <a class="dropdown-item" onclick=${() => ipcRenderer.send('csv', {action: 'import', type: 'mia'})} href="">Mathe im Advent</a>
                    </div>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#features">Features</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" onclick=${() => { emit('pushState', '#show'); $(window).scrollTop(0) }}>Table</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link"  href="#matchfinder">Matchfinder</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" onclick=${() => { ipcRenderer.send('invalidateSummary'); $(window).scrollTop(0) }} href="#summary">Summary</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" onclick=${() => { ipcRenderer.send('invalidateActions'); $(window).scrollTop(0) }} href="#actions">Actions</a>
                </li>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Export
                    </a>
                    <div class="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                        <a class="dropdown-item" onclick=${() => ipcRenderer.send('csv', {action: 'export', type: 'abi'})} href="">Abiturpreis Mathe</a>
                        <a class="dropdown-item" onclick=${() => ipcRenderer.send('csv', {action: 'export', type: 'mia'})} href="">Mathe im Advent</a>
                    </div>
                </li>
            </ul>
        </div><div class="wait"></div>
    </nav>
  `
}
