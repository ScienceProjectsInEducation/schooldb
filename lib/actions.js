module.exports = async function (mainWindow, sequelize) {
  const query = `SELECT actions.id, actions.createdAt, COUNT(schools.id) AS cnt
    FROM actions JOIN schools ON (actions.id = schools.created_by)
    WHERE actions.type='import'
    GROUP BY actions.id
    ORDER BY actions.createdAt DESC`

  mainWindow.webContents.send('actionsLoaded',
    (await sequelize.query(query))[0]
  )
}
