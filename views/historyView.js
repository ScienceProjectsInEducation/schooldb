const html = require('choo/html')
const $ = require('jquery')
const schoolInfo = require('./schoolInfo')
const navbar = require('./navbar')

const typeToColor = {
  merge: 'red',
  import: 'green',
  change: 'blue'
}

function transformX (x) {
  return 100 + x * 80
}

function transformY (y) {
  return 400 - y * 50
}

module.exports = function (state, emit) {
  return html`
    <body>
      ${navbar(emit)}
      <svg height="500" width="500">
        ${render(state.history)}
      </svg>
    </body>
  `

  function render (tree) {
    const widthUsed = [0]
    return renderTree(tree)

    function renderTree (tree, depth = 0, index = 0) {
      tree.nodes = tree.nodes || []
      const color = typeToColor[tree.type]
      if (!widthUsed[depth + 1]) widthUsed[depth + 1] = 0
      const currentX = transformX(widthUsed[depth])
      const currentY = transformY(depth)
      widthUsed[depth]++
      const subTrees = tree.nodes.map((node, index) => html`
        <g>
          <line x1="${currentX}" y1="${currentY}" x2="${transformX(widthUsed[depth + 1])}" y2="${transformY(depth + 1)}" stroke-width="2" stroke="${color}"/>
          ${renderTree(node, depth + 1, index)}
        </g>
      `
      )
      return html`
        <g>
          ${subTrees}
          <g onclick=${() => showSchool(tree.school, tree.changedAttributes)} >
          <circle cx="${currentX}" cy="${currentY}" r="5" stroke="black" stroke-width="3" fill="black" />
          <text x="${currentX + 10}" y="${currentY + 5}">${tree.school.id}</text>
          </g>
        </g>
      `
    }
  }

  function showSchool (school, changedAttributes) {
    // Create school with sources
    const newSchool = {}
    for (let attribute in school) {
      newSchool[attribute] = school[attribute]
      const source = changedAttributes[attribute]
      if (source) newSchool[attribute] += ` (${source})`
    }

    $(schoolInfo(newSchool)).modal()
  }
}
