import { Logger } from '@l2beat/backend-tools'
import { expect } from 'earl'

import { setupDatabaseTestSuite } from '../../test/database'
import { KeyValueStore } from './KeyValueStore'

describe(KeyValueStore.name, () => {
  const { database } = setupDatabaseTestSuite()
  const kvStore = new KeyValueStore(database, Logger.SILENT)

  afterEach(() => kvStore.deleteAll())

  it('sets and reads value', async () => {
    await kvStore.addOrUpdate({ key: 'softwareMigrationNumber', value: 1 })
    const actual = await kvStore.findByKey('softwareMigrationNumber')
    expect(actual).toEqual(1)
    await kvStore.deleteByKey('softwareMigrationNumber')
    const actualAfterDelete = await kvStore.findByKey('softwareMigrationNumber')
    expect(actualAfterDelete).toEqual(undefined)
  })

  it('reads value with default passed', async () => {
    const value = await kvStore.findByKeyWithDefault(
      'softwareMigrationNumber',
      119812
    )
    expect(value).toEqual(119812)
  })

  it("doesn't return default when value exists", async () => {
    await kvStore.addOrUpdate({ key: 'softwareMigrationNumber', value: 3 })
    const value = await kvStore.findByKeyWithDefault(
      'softwareMigrationNumber',
      119812
    )
    expect(value).toEqual(3)
  })

  it('reads and removes all values', async () => {
    await Promise.all([
      kvStore.addOrUpdate({ key: 'softwareMigrationNumber', value: 2 }),
      kvStore.addOrUpdate({ key: 'lastBlockNumberSynced', value: 12 }),
      kvStore.addOrUpdate({
        key: 'userStatisticsPreprocessorCaughtUp',
        value: true,
      }),
      kvStore.addOrUpdate({
        key: 'freezeStatus',
        value: 'not-frozen',
      }),
    ])

    let actual = await kvStore.getAll()
    expect(actual).toEqualUnsorted([
      { key: 'softwareMigrationNumber', value: 2 },
      { key: 'lastBlockNumberSynced', value: 12 },
      { key: 'userStatisticsPreprocessorCaughtUp', value: true },
      { key: 'freezeStatus', value: 'not-frozen' },
    ])

    await kvStore.deleteAll()
    actual = await kvStore.getAll()
    expect(actual).toEqual([])
  })
})
