import { AssetHash, AssetId } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'

import { BlockRange } from '../../model'
import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { JobQueue } from '../../tools/JobQueue'
import { FreezeCheckService } from '../FreezeCheckService'
import { IDataSyncService } from '../IDataSyncService'
import { Preprocessor } from '../preprocessing/Preprocessor'
import { BlockDownloader } from './BlockDownloader'
import {
  INITIAL_SYNC_STATE,
  SyncSchedulerAction,
  syncSchedulerReducer,
  SyncState,
} from './syncSchedulerReducer'

interface SyncSchedulerOptions {
  earliestBlock: number
  maxBlockNumber?: number
}

export class SyncScheduler {
  private state: SyncState = INITIAL_SYNC_STATE
  private jobQueue: JobQueue
  private earliestBlock: number
  private maxBlockNumber: number

  constructor(
    private readonly kvStore: KeyValueStore,
    private readonly blockDownloader: BlockDownloader,
    private readonly dataSyncService: IDataSyncService,
    private readonly preprocessor:
      | Preprocessor<AssetHash>
      | Preprocessor<AssetId>,
    private readonly freezeCheckService: FreezeCheckService,
    private readonly logger: Logger,
    opts: SyncSchedulerOptions
  ) {
    this.logger = logger.for(this)
    this.earliestBlock = opts.earliestBlock
    this.maxBlockNumber = opts.maxBlockNumber ?? Infinity
    this.jobQueue = new JobQueue({ maxConcurrentJobs: 1 }, this.logger)
  }

  async start() {
    const lastSynced =
      (await this.kvStore.findByKey('lastBlockNumberSynced')) ??
      this.earliestBlock

    await this.dataSyncService.discardAfter(lastSynced)

    await this.preprocessor.sync()
    await this.freezeCheckService.updateFreezeStatus()

    const knownBlocks = await this.blockDownloader.getKnownBlocks(lastSynced)
    this.dispatch({ type: 'initialized', lastSynced, knownBlocks })

    this.blockDownloader.onNewBlock((block) =>
      this.dispatch({ type: 'newBlockFound', block })
    )

    this.blockDownloader.onReorg((blocks) =>
      this.dispatch({ type: 'reorgOccurred', blocks })
    )

    this.logger.info('start', { lastSynced })
  }

  dispatch(action: SyncSchedulerAction) {
    const [newState, effect] = syncSchedulerReducer(this.state, action)
    this.state = newState

    this.logger.debug({ method: 'dispatch', action: action.type })

    if (effect) {
      this.jobQueue.add({
        name: 'action',
        execute: async () => {
          this.logger.debug({ method: 'effect', effect: effect.type })
          if (effect.type === 'sync') {
            await this.handleSync(effect.blocks)
          } else {
            await this.handleDiscardAfter(effect.blockNumber)
          }
        },
      })
    }
  }

  isTip(syncedBlockNumber: number) {
    return this.state.remaining.end === syncedBlockNumber
  }

  async handleSync(blocks: BlockRange) {
    if (blocks.end > this.maxBlockNumber) {
      this.logger.info(
        'Skipping data sync - the end of block range is after the max acceptable block number',
        {
          blockStart: blocks.start,
          blockEnd: blocks.end,
          maxBlockNumber: this.maxBlockNumber,
        }
      )
      // Returning here means no 'syncSucceeded' event will get dispatched
      // This means that syncSchedulerReducer will never return blocks to sync anymore
      // Used to limit the amount of data getting stored in the database if required (e.g. Heroku Review Apps)
      return
    }
    try {
      const isTip = this.isTip(blocks.end)
      await this.dataSyncService.discardAfter(blocks.start - 1)
      await this.dataSyncService.sync(blocks, isTip)
      await this.kvStore.addOrUpdate({
        key: 'lastBlockNumberSynced',
        value: blocks.end - 1,
      })
      await this.preprocessor.sync()
      await this.freezeCheckService.updateFreezeStatus()
      this.dispatch({ type: 'syncSucceeded' })
    } catch (err) {
      this.dispatch({ type: 'syncFailed', blocks })
      this.logger.error(err)
    }
  }

  private async handleDiscardAfter(blockNumber: number) {
    try {
      await this.kvStore.addOrUpdate({
        key: 'lastBlockNumberSynced',
        value: blockNumber,
      })
      await this.preprocessor.sync()
      await this.dataSyncService.discardAfter(blockNumber)
      await this.freezeCheckService.updateFreezeStatus()
      this.dispatch({ type: 'discardAfterSucceeded', blockNumber })
    } catch (err) {
      this.dispatch({ type: 'discardAfterFailed' })
      this.logger.error(err)
    }
  }
}
