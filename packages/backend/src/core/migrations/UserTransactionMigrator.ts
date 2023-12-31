import {
  CollateralAsset,
  decodePerpetualForcedTradeRequest,
  decodePerpetualForcedWithdrawalRequest,
  decodeWithdrawal,
} from '@explorer/shared'
import { AssetHash, Hash256, Timestamp } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'

import { BlockRange } from '../../model'
import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { Database } from '../../peripherals/database/shared/Database'
import { SentTransactionRepository } from '../../peripherals/database/transactions/SentTransactionRepository'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { UserTransactionCollector } from '../collectors/UserTransactionCollector'

export class UserTransactionMigrator {
  constructor(
    private database: Database,
    private kvStore: KeyValueStore,
    private userTransactionRepository: UserTransactionRepository,
    private sentTransactionRepository: SentTransactionRepository,
    private userTransactionCollector: UserTransactionCollector,
    private ethereumClient: EthereumClient,
    private collateralAsset: CollateralAsset | undefined,
    private logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  async migrate(): Promise<void> {
    const migrationNumber =
      (await this.kvStore.findByKey('softwareMigrationNumber')) ?? 0

    if (migrationNumber >= 1) {
      return
    }
    await this.migrateUserTransactions()
    await this.kvStore.addOrUpdate({
      key: 'softwareMigrationNumber',
      value: 1,
    })
  }

  private async migrateUserTransactions() {
    const lastSyncedBlock = await this.kvStore.findByKey(
      'lastBlockNumberSynced'
    )
    if (lastSyncedBlock === undefined) {
      return
    }
    this.logger.info('User transactions migration started')

    await this.clearRepositories()
    await this.collectUserTransactions(lastSyncedBlock)
    await this.migrateIncludedTransactions()
    await this.migrateSentTransactions()

    this.logger.info('Migration finished')
  }

  private async clearRepositories() {
    await this.userTransactionRepository.deleteAll()
    await this.sentTransactionRepository.deleteAll()
    this.logger.info('Cleared user- and sent- transaction repositories')
  }

  private async collectUserTransactions(lastSyncedBlock: number) {
    // A quick hack to lower the amount of events processed in one go
    // due to "Reached heap limit" error on Heroku
    const deltaBlocks = 500000
    let firstBlock = 0
    while (firstBlock < lastSyncedBlock) {
      const lastBlock = Math.min(firstBlock + deltaBlocks, lastSyncedBlock)
      await this.collectInRange(firstBlock, lastBlock)
      firstBlock = lastBlock + 1
    }
    this.logger.info('Collection finished')
  }

  private async collectInRange(firstBlock: number, lastBlock: number) {
    this.logger.info(`Collecting in range ${firstBlock} - ${lastBlock}`)
    const blockRange = new BlockRange([], firstBlock, lastBlock)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const timestamps = require('./blockTimestamps.json') as Record<
      number,
      number
    >
    const knownBlockTimestamps = new Map<number, number>(
      Object.entries(timestamps).map(([k, v]) => [parseInt(k), v])
    )
    await this.userTransactionCollector.collect(
      blockRange,
      knownBlockTimestamps,
      {
        skipUserTransactionRepository: false,
        skipWithdrawableAssetRepository: true,
      }
    )
  }

  private async migrateIncludedTransactions() {
    const knex = await this.database.getKnex()

    interface Row {
      hash: string
      state_update_id: number
      block_number: number
      timestamp: bigint
    }

    const rows = await knex('forced_transactions')
      .join(
        'state_updates',
        'state_updates.id',
        'forced_transactions.state_update_id'
      )
      .select<Row[]>(
        'forced_transactions.hash',
        'forced_transactions.state_update_id',
        'state_updates.block_number',
        'state_updates.timestamp'
      )

    await this.userTransactionRepository.addManyIncluded(
      rows.map((row) => ({
        transactionHash: Hash256(row.hash),
        stateUpdateId: row.state_update_id,
        blockNumber: row.block_number,
        timestamp: Timestamp(row.timestamp),
      }))
    )
  }

  private async migrateSentTransactions() {
    const knex = await this.database.getKnex()

    const rows = await knex('transaction_status')
      .select('hash', 'sent_at')
      .where('forgotten_at', null)
      .whereNot('sent_at', null)

    const offers = await knex('forced_trade_offers')
      .select('id', 'transaction_hash')
      .whereNot('transaction_hash', null)

    await Promise.all(
      rows.map(async (row) => {
        if (!row.sent_at) {
          return
        }
        const transactionHash = Hash256(row.hash)
        const timestamp = Timestamp(row.sent_at)

        const tx = await this.ethereumClient.getTransaction(transactionHash)
        if (tx === undefined) {
          return
        }

        if (tx.data.startsWith('0x441a3e70')) {
          const data = decodeWithdrawal(tx.data)
          if (!data) {
            throw new Error('Cannot decode finalize exit request!')
          }
          await this.sentTransactionRepository.add({
            transactionHash,
            timestamp,
            data: {
              type: 'Withdraw',
              starkKey: data.starkKey,
              assetType: AssetHash(data.assetTypeHash.toString()),
            },
          })
        } else if (tx.data.startsWith('0xaf1437a3')) {
          const data = decodePerpetualForcedWithdrawalRequest(tx.data)
          if (!data) {
            throw new Error('Cannot decode forced withdrawal request!')
          }
          await this.sentTransactionRepository.add({
            transactionHash,
            timestamp,
            data: {
              type: 'ForcedWithdrawal',
              quantizedAmount: data.quantizedAmount,
              positionId: data.positionId,
              starkKey: data.starkKey,
              premiumCost: data.premiumCost,
            },
          })
        } else if (tx.data.startsWith('0x2ecb8162')) {
          if (!this.collateralAsset) {
            throw new Error('Collateral asset is not set!')
          }
          const data = decodePerpetualForcedTradeRequest(
            tx.data,
            this.collateralAsset
          )
          if (!data) {
            throw new Error('Cannot decode forced trade request!')
          }
          const offerId = offers.find(
            (x) => x.transaction_hash === row.hash
          )?.id
          if (!offerId) {
            throw new Error('Cannot find offer!')
          }
          await this.sentTransactionRepository.add({
            transactionHash,
            timestamp,
            data: {
              type: 'ForcedTrade',
              starkKeyA: data.starkKeyA,
              starkKeyB: data.starkKeyB,
              positionIdA: data.positionIdA,
              positionIdB: data.positionIdB,
              collateralAmount: data.collateralAmount,
              collateralAssetId: this.collateralAsset.assetId,
              syntheticAmount: data.syntheticAmount,
              syntheticAssetId: data.syntheticAssetId,
              isABuyingSynthetic: data.isABuyingSynthetic,
              submissionExpirationTime: data.submissionExpirationTime,
              nonce: data.nonce,
              signatureB: data.signature,
              premiumCost: data.premiumCost,
              offerId,
            },
          })
        } else {
          throw new Error('Unknown transaction data!')
        }

        const receipt = await this.ethereumClient.getTransactionReceipt(
          transactionHash
        )
        const receiptTimestamp = await this.ethereumClient.getBlockTimestamp(
          receipt.blockNumber
        )
        await this.sentTransactionRepository.updateMined(transactionHash, {
          blockNumber: receipt.blockNumber,
          timestamp: Timestamp.fromSeconds(receiptTimestamp),
          reverted: receipt.status === 0,
        })

        this.logger.info('Added sent transaction', {
          transactionHash: transactionHash.toString(),
        })
      })
    )
  }
}
