import {
  stringAs,
  stringAsBigInt,
  stringAsInt,
  stringAsPositiveInt,
} from '@explorer/shared'
import { AssetId } from '@explorer/types'
import Router from '@koa/router'
import { z } from 'zod'

import { Config } from '../../config'
import { ForcedActionController } from '../controllers/ForcedActionController'
import { ForcedTradeOfferController } from '../controllers/ForcedTradeOfferController'
import { HomeController } from '../controllers/HomeController'
import { L2TransactionController } from '../controllers/L2TransactionController'
import { withTypedContext } from './types'
import { applyControllerResult, getGivenUser, getPagination } from './utils'

export function addPerpetualTradingRoutes(
  router: Router,
  homeController: HomeController,
  forcedTradeOfferController: ForcedTradeOfferController,
  forcedActionController: ForcedActionController,
  l2TransactionController: L2TransactionController,
  config: Config<'perpetual'>
) {
  router.get(
    '/forced/new/:positionId/:assetId',
    withTypedContext(
      z.object({
        params: z.object({
          positionId: stringAsBigInt(),
          assetId: stringAs(AssetId),
        }),
      }),
      async (ctx) => {
        const { positionId, assetId } = ctx.params
        const givenUser = getGivenUser(ctx)

        const result =
          assetId === config.starkex.collateralAsset.assetId
            ? await forcedActionController.getPerpetualForcedWithdrawalPage(
                givenUser,
                positionId,
                assetId
              )
            : await forcedActionController.getPerpetualForcedTradePage(
                givenUser,
                positionId,
                assetId
              )

        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/offers',
    withTypedContext(
      z.object({
        query: z.object({
          page: z.optional(stringAsPositiveInt()),
          perPage: z.optional(stringAsPositiveInt()),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const pagination = getPagination(ctx.query)
        const result = await homeController.getHomeAvailableOffersPage(
          givenUser,
          pagination
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/offers/:offerId',
    withTypedContext(
      z.object({
        params: z.object({
          offerId: z.string(),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const result = await forcedTradeOfferController.getOfferDetailsPage(
          Number(ctx.params.offerId),
          givenUser
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  if (config.starkex.l2Transactions.enabled) {
    router.get(
      '/l2-transactions/:transactionId{/:multiIndex}?',
      withTypedContext(
        z.object({
          params: z.object({
            transactionId: stringAsInt(),
            multiIndex: z.optional(stringAsInt()),
          }),
        }),
        async (ctx) => {
          const givenUser = getGivenUser(ctx)
          const result =
            await l2TransactionController.getPerpetualL2TransactionDetailsPage(
              givenUser,
              ctx.params.transactionId,
              ctx.params.multiIndex
            )
          applyControllerResult(ctx, result)
        }
      )
    )

    router.get(
      '/raw-l2-transactions/:transactionId{/:multiIndex}?',
      withTypedContext(
        z.object({
          params: z.object({
            transactionId: stringAsInt(),
            multiIndex: z.optional(stringAsInt()),
          }),
        }),
        async (ctx) => {
          const givenUser = getGivenUser(ctx)
          const result = await l2TransactionController.getRawL2TransactionPage(
            givenUser,
            ctx.params.transactionId,
            ctx.params.multiIndex
          )
          applyControllerResult(ctx, result)
        }
      )
    )

    router.get(
      '/l2-transactions/:transactionId/alternatives/:altIndex{/:multiIndex}?',
      withTypedContext(
        z.object({
          params: z.object({
            transactionId: stringAsInt(),
            altIndex: z.optional(stringAsInt()),
            multiIndex: z.optional(stringAsInt()),
          }),
        }),
        async (ctx) => {
          const givenUser = getGivenUser(ctx)
          const result =
            await l2TransactionController.getPerpetualL2TransactionDetailsPage(
              givenUser,
              ctx.params.transactionId,
              ctx.params.multiIndex,
              ctx.params.altIndex
            )
          applyControllerResult(ctx, result)
        }
      )
    )

    router.get(
      '/raw-l2-transactions/:transactionId/alternatives/:altIndex{/:multiIndex}?',
      withTypedContext(
        z.object({
          params: z.object({
            transactionId: stringAsInt(),
            altIndex: z.optional(stringAsInt()),
            multiIndex: z.optional(stringAsInt()),
          }),
        }),
        async (ctx) => {
          const givenUser = getGivenUser(ctx)
          const result = await l2TransactionController.getRawL2TransactionPage(
            givenUser,
            ctx.params.transactionId,
            ctx.params.multiIndex,
            ctx.params.altIndex
          )
          applyControllerResult(ctx, result)
        }
      )
    )
  }
}
