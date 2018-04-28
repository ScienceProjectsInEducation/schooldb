module.exports = async function (mainWindow, changeProperties, Sequelize, School, Action, sequelize) {
  async function calculateDistribution (attribute) {
    const rows = await School.findAll({
      attributes: [attribute, [Sequelize.literal('count(*)'), 'cnt']],
      group: attribute,
      where: { used_for: null },
      order: [[Sequelize.literal('cnt'), 'DESC']]
    })
    return rows.map(row => [row.dataValues[attribute], row.dataValues.cnt])
  }

  async function queryBadColumns () {
    const badColumsQuery = changeProperties.reduce(
      (acc, property) => `${acc} SELECT count(*) AS cnt, "${property}" AS name
        FROM schools WHERE ${property} IS NULL OR ${property} = "" AND used_for IS NULL;`,
      ''
    )
    const badColumnsResult = await sequelize.query(badColumsQuery)
    return badColumnsResult[0]
      .map(result => [result[0].name, result[0].cnt])
      .sort((a, b) => a[1] > b[1] ? -1 : 1)
  }

  async function queryActionEnumTypes () {
    const enumTypesQuery = 'SHOW COLUMNS FROM actions WHERE Field = "type"'
    const enumTypesResult = await sequelize.query(enumTypesQuery)
    return enumTypesResult[0][0].Type.match(/'(.*?)'/g).map(enumType => enumType.replace(/'/g, ''))
  }

  async function queryActionJoin (enumTypes, joinKey, showOutdated = false) {
    const showOutdatedCondition = showOutdated ? '' : 'AND schools.used_for IS NULL'
    const actionJoinQuery = enumTypes.reduce(
      (acc, enumType) => `${acc} SELECT count(*) AS cnt, "${enumType}" AS enumType
        FROM schools JOIN actions ON schools.${joinKey} = actions.id
        WHERE actions.type = "${enumType}" ${showOutdatedCondition};`,
      ''
    )
    const actionJoinResult = await sequelize.query(actionJoinQuery)
    return actionJoinResult[0]
      .map(result => [result[0].enumType, result[0].cnt])
      .sort((a, b) => a[1] > b[1] ? -1 : 1)
  }

  const enumTypes = await queryActionEnumTypes()

  mainWindow.webContents.send('summaryLoaded', {
    states: await calculateDistribution('state'),
    schooltypes: await calculateDistribution('type'),
    badColumns: await queryBadColumns(),
    createdBy: await queryActionJoin(enumTypes.filter(value => value !== 'delete'), 'created_by'),
    usedFor: await queryActionJoin(enumTypes.filter(value => value !== 'import'), 'used_for', true)
  })
}
