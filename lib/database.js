const Sequelize = require('sequelize')

module.exports = async function (connectionString) {
  // Definiere Verbindung
  const sequelize = new Sequelize(connectionString, {
    logging: false,
    dialectOptions: {
      multipleStatements: true
    }
  })

  // Verbindung herstellen
  await sequelize.authenticate()
  console.log('Connection has been established successfully.')

  // Datenbank-Model "Action"

  const Action = sequelize.define('action', {
    type: {
      type: Sequelize.ENUM('import', 'merge', 'change', 'delete')
    },
    source: {
      type: Sequelize.STRING
    },
    filename: {
      type: Sequelize.STRING
    }
  }, {
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
  })

  // Datenbank-Model "School"
  const School = sequelize.define('school', {
    created_by: {
      type: Sequelize.INTEGER,
      references: {
        model: Action,
        key: 'id'
      }
    },
    used_for: {
      type: Sequelize.INTEGER,
      references: {
        model: Action,
        key: 'id'
      }
    },
    csv_id: {
      type: Sequelize.INTEGER
    },
    title: {
      type: Sequelize.STRING
    },
    street: {
      type: Sequelize.STRING
    },
    house_nr: {
      type: Sequelize.STRING
    },
    postalcode: {
      type: Sequelize.STRING
    },
    city: {
      type: Sequelize.STRING
    },
    state: {
      type: Sequelize.STRING
    },
    country: {
      type: Sequelize.STRING
    },
    type: {
      type: Sequelize.STRING
    },
    type_secondary: {
      type: Sequelize.STRING
    },
    email: {
      type: Sequelize.STRING
    },
    telephone_country: {
      type: Sequelize.STRING
    },
    telephone_city: {
      type: Sequelize.STRING
    },
    telephone: {
      type: Sequelize.STRING
    },
    highest_level: {
      type: Sequelize.STRING
    },
    students_amount: {
      type: Sequelize.STRING
    },
    update_date: {
      type: Sequelize.STRING
    }
  }, {
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
  })

  const Match = sequelize.define('match', {
    id1: {
      type: Sequelize.INTEGER,
      references: {
        model: School,
        key: 'id'
      }
    },
    id2: {
      type: Sequelize.INTEGER,
      references: {
        model: School,
        key: 'id'
      }
    },
    value: {
      type: Sequelize.FLOAT
    }
  }, {
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
  })

  const DontMerge = sequelize.define('dont_merge', {
    id1: {
      type: Sequelize.INTEGER,
      references: {
        model: School,
        key: 'id'
      }
    },
    id2: {
      type: Sequelize.INTEGER,
      references: {
        model: School,
        key: 'id'
      }
    },
    comment: {
      type: Sequelize.STRING
    }
  }, {
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
  })

  const SourceType = sequelize.define('source_type', {
    title: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }, {
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
  })

  const Source = sequelize.define('source', {
    action: {
      type: Sequelize.INTEGER,
      references: {
        model: Action,
        key: 'id'
      }
    },
    type: {
      type: Sequelize.INTEGER,
      references: {
        model: SourceType,
        key: 'id'
      }
    },
    school: {
      type: Sequelize.INTEGER,
      references: {
        model: School,
        key: 'id'
      }
    },
    field: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }, {
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
  })

  await Action.sync()
  await School.sync()
  await Match.sync()
  await DontMerge.sync()
  await SourceType.sync()
  await Source.sync()

  return {School, Action, Match, DontMerge, SourceType, Source, sequelize}
}
