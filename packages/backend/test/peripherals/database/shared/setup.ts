import { Database } from '../../../../src/peripherals/database/shared/Database'
import { Logger } from '../../../../src/tools/Logger'

export function setupDatabaseTestSuite() {
  const { database, skip } = getTestDatabase()

  before(async function () {
    if (skip) {
      this.skip()
    } else {
      await database.migrateToLatest()
    }
  })

  after(async () => {
    await database.closeConnection()
  })

  return { database }
}

export function getTestDatabase() {
  const connection = process.env.TEST_DB_URL
  const database = new Database(connection, Logger.SILENT)
  return {
    database,
    skip: connection === undefined,
  }
}