import { AssetHash, Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'
import { Knex } from 'knex'
import { range } from 'lodash'

import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import {
  PreprocessedStateDetailsRecord,
  PreprocessedStateDetailsRepository,
} from '../../peripherals/database/PreprocessedStateDetailsRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { StateDetailsPreprocessor } from './StateDetailsPreprocessor'

const stateUpdate: StateUpdateRecord = {
  id: 200,
  batchId: 199,
  blockNumber: 1_000,
  stateTransitionHash: Hash256.fake(),
  rootHash: PedersenHash.fake(),
  timestamp: Timestamp(1_000_000_000),
}

describe(StateDetailsPreprocessor.name, () => {
  describe(
    StateDetailsPreprocessor.prototype.preprocessNextStateUpdate.name,
    () => {
      it('should calculate assetUpdateCount and forcedTransactionCount', async () => {
        const trx = mockObject<Knex.Transaction>()
        const preprocessedStateDetailsId = 15

        const mockPreprocessedAssetHistoryRepository = mockObject<
          PreprocessedAssetHistoryRepository<AssetHash>
        >({
          getCountByStateUpdateId: mockFn().resolvesTo(10),
        })
        const mockUserTransactionRepository =
          mockObject<UserTransactionRepository>({
            getCountOfIncludedByStateUpdateId: mockFn().resolvesTo(20),
          })
        const mockPreprocessedStateDetailsRepository =
          mockObject<PreprocessedStateDetailsRepository>({
            add: mockFn().resolvesTo(preprocessedStateDetailsId),
          })
        const mockL2TransactionRepository = mockObject<L2TransactionRepository>(
          {}
        )

        const stateDetailsPreprocessor = new StateDetailsPreprocessor(
          mockPreprocessedStateDetailsRepository,
          mockPreprocessedAssetHistoryRepository,
          mockUserTransactionRepository,
          mockL2TransactionRepository
        )

        const mockCatchUpL2TransactionsFn = mockFn().resolvesTo(void 0)
        stateDetailsPreprocessor.catchUpL2Transactions =
          mockCatchUpL2TransactionsFn

        await stateDetailsPreprocessor.preprocessNextStateUpdate(
          trx,
          stateUpdate
        )

        expect(
          mockPreprocessedStateDetailsRepository.add
        ).toHaveBeenOnlyCalledWith(
          {
            stateUpdateId: stateUpdate.id,
            stateTransitionHash: stateUpdate.stateTransitionHash,
            rootHash: stateUpdate.rootHash,
            blockNumber: stateUpdate.blockNumber,
            timestamp: stateUpdate.timestamp,
            assetUpdateCount: 10,
            forcedTransactionCount: 20,
          },
          trx
        )

        expect(mockCatchUpL2TransactionsFn).toHaveBeenCalledWith(
          trx,
          stateUpdate.id
        )
      })
    }
  )

  describe(
    StateDetailsPreprocessor.prototype.rollbackOneStateUpdate.name,
    () => {
      it('should delete the state details', async () => {
        const trx = mockObject<Knex.Transaction>()
        const mockPreprocessedStateDetailsRepository =
          mockObject<PreprocessedStateDetailsRepository>({
            deleteByStateUpdateId: mockFn().resolvesTo(undefined),
          })

        const stateDetailsPreprocessor = new StateDetailsPreprocessor(
          mockPreprocessedStateDetailsRepository,
          mockObject<PreprocessedAssetHistoryRepository<AssetHash>>(),
          mockObject<UserTransactionRepository>(),
          mockObject<L2TransactionRepository>()
        )

        await stateDetailsPreprocessor.rollbackOneStateUpdate(
          trx,
          stateUpdate.id
        )

        expect(
          mockPreprocessedStateDetailsRepository.deleteByStateUpdateId
        ).toHaveBeenOnlyCalledWith(stateUpdate.id, trx)
      })
    }
  )

  describe.only(
    StateDetailsPreprocessor.prototype.catchUpL2Transactions.name,
    () => {
      const l2TransactionStatistics = {
        l2TransactionCount: 500,
        l2ReplacedTransactionCount: 1,
        l2MultiTransactionCount: 2,
      }

      it('should catch up preprocessed records with l2 transaction data from lastPreprocessedRecordWithL2TransactionCount to the currently preprocessed state update', async () => {
        const trx = mockObject<Knex.Transaction>()
        const catchUpToStateUpdateId = 200
        const lastPreprocessedRecordWithL2TransactionCount = {
          stateUpdateId: 195,
        }
        const lastL2TransactionStateUpdateId = 210
        const mockedPreprocessedStateDetailsRepository =
          mockObject<PreprocessedStateDetailsRepository>({
            findLastWithL2TransactionCount: mockFn().resolvesTo(
              lastPreprocessedRecordWithL2TransactionCount
            ),
            findByStateUpdateId: mockFn(
              async (id: number, trx: Knex.Transaction) =>
                ({ id: id + 1 } as PreprocessedStateDetailsRecord | undefined)
            ),
            update: mockFn().resolvesTo(1),
          })
        const mockedL2TransactionRepository =
          mockObject<L2TransactionRepository>({
            findLatestStateUpdateId: mockFn().resolvesTo(
              lastL2TransactionStateUpdateId
            ),
            getStatisticsByStateUpdateId: mockFn().resolvesTo(
              l2TransactionStatistics
            ),
          })
        const stateDetailsPreprocessor = new StateDetailsPreprocessor(
          mockedPreprocessedStateDetailsRepository,
          mockObject<PreprocessedAssetHistoryRepository<AssetHash>>(),
          mockObject<UserTransactionRepository>(),
          mockedL2TransactionRepository
        )

        await stateDetailsPreprocessor.catchUpL2Transactions(
          trx,
          catchUpToStateUpdateId
        )

        expect(
          mockedPreprocessedStateDetailsRepository.findLastWithL2TransactionCount
        ).toHaveBeenCalledWith(trx)
        expect(
          mockedL2TransactionRepository.findLatestStateUpdateId
        ).toHaveBeenCalledWith(trx)

        range(
          catchUpToStateUpdateId -
            lastPreprocessedRecordWithL2TransactionCount.stateUpdateId
        ).forEach((i) => {
          expect(
            mockedPreprocessedStateDetailsRepository.findByStateUpdateId
          ).toHaveBeenNthCalledWith(
            i + 1,
            lastPreprocessedRecordWithL2TransactionCount.stateUpdateId + i + 1,
            trx
          )

          expect(
            mockedL2TransactionRepository.getStatisticsByStateUpdateId
          ).toHaveBeenNthCalledWith(
            i + 1,
            lastPreprocessedRecordWithL2TransactionCount.stateUpdateId + i + 1,
            trx
          )

          expect(
            mockedPreprocessedStateDetailsRepository.update
          ).toHaveBeenNthCalledWith(
            i + 1,
            {
              id:
                lastPreprocessedRecordWithL2TransactionCount.stateUpdateId +
                i +
                2,
              l2TransactionCount: l2TransactionStatistics.l2TransactionCount,
              l2ReplacedTransactionCount:
                l2TransactionStatistics.l2ReplacedTransactionCount,
              l2MultiTransactionCount:
                l2TransactionStatistics.l2MultiTransactionCount,
            },
            trx
          )
        })
      })

      it('should catch up preprocessed records with l2 transaction data from 0 (if no record was preprocessed before) to the latest l2 transaction state update id', async () => {
        const trx = mockObject<Knex.Transaction>()
        const catchUpToStateUpdateId = 10
        const lastL2TransactionStateUpdateId = 5
        const mockedPreprocessedStateDetailsRepository =
          mockObject<PreprocessedStateDetailsRepository>({
            findLastWithL2TransactionCount: mockFn().resolvesTo(undefined),
            findByStateUpdateId: mockFn(
              async (id: number, trx: Knex.Transaction) =>
                ({ id: id + 1 } as PreprocessedStateDetailsRecord | undefined)
            ),
            update: mockFn().resolvesTo(1),
          })
        const mockedL2TransactionRepository =
          mockObject<L2TransactionRepository>({
            findLatestStateUpdateId: mockFn().resolvesTo(
              lastL2TransactionStateUpdateId
            ),
            getStatisticsByStateUpdateId: mockFn().resolvesTo(
              l2TransactionStatistics
            ),
          })
        const stateDetailsPreprocessor = new StateDetailsPreprocessor(
          mockedPreprocessedStateDetailsRepository,
          mockObject<PreprocessedAssetHistoryRepository<AssetHash>>(),
          mockObject<UserTransactionRepository>(),
          mockedL2TransactionRepository
        )

        await stateDetailsPreprocessor.catchUpL2Transactions(
          trx,
          catchUpToStateUpdateId
        )

        expect(
          mockedPreprocessedStateDetailsRepository.findLastWithL2TransactionCount
        ).toHaveBeenCalledWith(trx)
        expect(
          mockedL2TransactionRepository.findLatestStateUpdateId
        ).toHaveBeenCalledWith(trx)

        range(lastL2TransactionStateUpdateId).forEach((i) => {
          expect(
            mockedPreprocessedStateDetailsRepository.findByStateUpdateId
          ).toHaveBeenNthCalledWith(i + 1, i + 1, trx)

          expect(
            mockedL2TransactionRepository.getStatisticsByStateUpdateId
          ).toHaveBeenNthCalledWith(i + 1, i + 1, trx)

          expect(
            mockedPreprocessedStateDetailsRepository.update
          ).toHaveBeenNthCalledWith(
            i + 1,
            {
              id: i + 2,
              l2TransactionCount: l2TransactionStatistics.l2TransactionCount,
              l2ReplacedTransactionCount:
                l2TransactionStatistics.l2ReplacedTransactionCount,
              l2MultiTransactionCount:
                l2TransactionStatistics.l2MultiTransactionCount,
            },
            trx
          )
        })
      })

      it.only('should throw an error if no preprocessed state details record was found', async () => {
        const trx = mockObject<Knex.Transaction>()
        const catchUpToStateUpdateId = 10
        const lastL2TransactionStateUpdateId = 5
        const mockedPreprocessedStateDetailsRepository =
          mockObject<PreprocessedStateDetailsRepository>({
            findLastWithL2TransactionCount: mockFn().resolvesTo(undefined),
            findByStateUpdateId: mockFn().resolvesTo(undefined),
            update: mockFn().resolvesTo(1),
          })
        const mockedL2TransactionRepository =
          mockObject<L2TransactionRepository>({
            findLatestStateUpdateId: mockFn().resolvesTo(
              lastL2TransactionStateUpdateId
            ),
            getStatisticsByStateUpdateId: mockFn().resolvesTo(
              l2TransactionStatistics
            ),
          })
        const stateDetailsPreprocessor = new StateDetailsPreprocessor(
          mockedPreprocessedStateDetailsRepository,
          mockObject<PreprocessedAssetHistoryRepository<AssetHash>>(),
          mockObject<UserTransactionRepository>(),
          mockedL2TransactionRepository
        )

        await expect(() =>
          stateDetailsPreprocessor.catchUpL2Transactions(
            trx,
            catchUpToStateUpdateId
          )
        ).toBeRejectedWith(Error)
      })
    }
  )
})
