import {
  AcceptOfferFormData,
  CancelOfferFormData,
  FinalizeOfferFormData,
  PageContext,
} from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset } from '../../../utils/assets'
import { Button } from '../../components/Button'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { PageTitle } from '../../components/PageTitle'
import { reactToHtml } from '../../reactToHtml'
import {
  FORCED_TRANSACTION_MINED,
  FORCED_TRANSACTION_SENT,
  TRANSACTION_REVERTED,
} from './common'
import { AcceptOfferForm } from './components/AcceptOfferForm'
import { CancelOfferForm } from './components/CancelOfferForm'
import { FinalizeOfferForm } from './components/FinalizeOfferForm'
import {
  TransactionHistoryEntry,
  TransactionHistoryTable,
} from './components/HistoryTable'
import { IncludedWithStateUpdateId } from './components/IncludedWithStateUpdateId'
import { TransactionOverview } from './components/TransactionOverview'
import { TransactionPageTitle } from './components/TransactionPageTitle'
import { TransactionUserDetails } from './components/TransactionUserDetails'

interface OfferAndForcedTradePageProps {
  context: PageContext<'perpetual'>
  offerId: string | undefined
  transactionHash?: Hash256
  maker: {
    starkKey: StarkKey
    ethereumAddress: EthereumAddress
    positionId: string
  }
  taker?: {
    starkKey: StarkKey
    ethereumAddress: EthereumAddress
    positionId: string
  }
  type: 'BUY' | 'SELL'
  collateralAmount: bigint
  syntheticAsset: Asset
  syntheticAmount: bigint
  history: {
    timestamp: Timestamp | undefined
    status:
      | 'CREATED'
      | 'CANCELLED'
      | 'ACCEPTED'
      | 'EXPIRED'
      | 'SENT'
      | 'MINED'
      | 'REVERTED'
      | 'INCLUDED'
  }[]
  expirationTimestamp?: Timestamp
  stateUpdateId?: number
  acceptOfferFormData?: AcceptOfferFormData
  cancelOfferFormData?: CancelOfferFormData
  finalizeOfferFormData?: FinalizeOfferFormData
}

export function renderOfferAndForcedTradePage(
  props: OfferAndForcedTradePageProps
) {
  return reactToHtml(<OfferAndForcedTradePage {...props} />)
}

function OfferAndForcedTradePage(props: OfferAndForcedTradePageProps) {
  const common = getCommon(props.transactionHash, props.offerId)
  const historyEntries = props.history.map((x) =>
    toHistoryEntry(x, props.type, props.stateUpdateId)
  )
  const lastEntry = historyEntries[0]
  const status = props.history[0]?.status
  if (!lastEntry) {
    throw new Error('No history entries')
  }

  return (
    <Page
      context={props.context}
      path={common.path}
      description={common.description}
    >
      <ContentWrapper className="flex flex-col gap-12">
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            {props.transactionHash ? (
              <TransactionPageTitle
                title={`Forced ${props.type.toLowerCase()}`}
                transactionHash={props.transactionHash}
              />
            ) : (
              <PageTitle>
                Forced {props.type.toLowerCase()} offer{' '}
                {props.offerId ? `#${props.offerId}` : ''}
              </PageTitle>
            )}
            <div className="mb-6 flex items-center gap-2">
              {props.acceptOfferFormData && (
                <AcceptOfferForm {...props.acceptOfferFormData}>
                  <Button>
                    Accept & {props.type === 'BUY' ? 'sell' : 'buy'}
                  </Button>
                </AcceptOfferForm>
              )}
              {props.cancelOfferFormData && (
                <CancelOfferForm {...props.cancelOfferFormData}>
                  <Button variant="outlined">Cancel</Button>
                </CancelOfferForm>
              )}
              {props.finalizeOfferFormData && (
                <FinalizeOfferForm {...props.finalizeOfferFormData}>
                  <Button>Send transaction</Button>
                </FinalizeOfferForm>
              )}
            </div>
          </div>
          <TransactionOverview
            chainId={props.context.chainId}
            stateUpdateId={props.stateUpdateId}
            statusText={lastEntry.statusText}
            statusType={lastEntry.statusType}
            statusDescription={lastEntry.description}
            transactionHash={props.transactionHash}
            timestamp={
              !props.transactionHash &&
              status !== 'EXPIRED' &&
              props.expirationTimestamp
                ? {
                    label: 'Expiration timestamp',
                    timestamp: props.expirationTimestamp,
                  }
                : undefined
            }
            trade={
              props.type === 'SELL'
                ? {
                    offeredAmount: props.syntheticAmount,
                    offeredAsset: props.syntheticAsset,
                    receivedAmount: props.collateralAmount,
                    receivedAsset: {
                      hashOrId: props.context.collateralAsset.assetId,
                    },
                  }
                : {
                    offeredAmount: props.collateralAmount,
                    offeredAsset: {
                      hashOrId: props.context.collateralAsset.assetId,
                    },
                    receivedAmount: props.syntheticAmount,
                    receivedAsset: props.syntheticAsset,
                  }
            }
          />
        </div>
        <TransactionUserDetails
          title="Creator details"
          tradingMode="perpetual"
          chainId={props.context.chainId}
          starkKey={props.maker.starkKey}
          ethereumAddress={props.maker.ethereumAddress}
          vaultOrPositionId={props.maker.positionId}
        />
        {props.taker && (
          <TransactionUserDetails
            title={`${props.type === 'BUY' ? 'Seller' : 'Buyer'} details`}
            tradingMode="perpetual"
            chainId={props.context.chainId}
            starkKey={props.taker.starkKey}
            ethereumAddress={props.taker.ethereumAddress}
            vaultOrPositionId={props.taker.positionId}
          />
        )}
        <TransactionHistoryTable entries={historyEntries} />
      </ContentWrapper>
    </Page>
  )
}

function toHistoryEntry(
  entry: OfferAndForcedTradePageProps['history'][number],
  type: 'BUY' | 'SELL',
  stateUpdateId?: number
): TransactionHistoryEntry {
  switch (entry.status) {
    case 'CREATED':
      return {
        timestamp: entry.timestamp,
        statusText: 'CREATED (1/5)',
        statusType: 'BEGIN',
        description: `Offer created, looking for ${
          type === 'BUY' ? 'sellers' : 'buyers'
        } to accept`,
      }
    case 'CANCELLED':
      return {
        timestamp: entry.timestamp,
        statusText: 'CANCELLED',
        statusType: 'CANCEL',
        description: 'Offer cancelled by creator',
      }
    case 'ACCEPTED':
      return {
        timestamp: entry.timestamp,
        statusText: 'ACCEPTED (2/5)',
        statusType: 'MIDDLE',
        description: `${
          type === 'BUY' ? 'Seller' : 'Buyer'
        } found, waiting for creator to send`,
      }
    case 'EXPIRED':
      return {
        timestamp: entry.timestamp,
        statusText: 'EXPIRED',
        statusType: 'CANCEL',
        description: 'Offer expired',
      }
    case 'SENT':
      return {
        timestamp: entry.timestamp,
        statusText: 'SENT (3/5)',
        statusType: 'MIDDLE',
        description: FORCED_TRANSACTION_SENT,
      }
    case 'MINED':
      return {
        timestamp: entry.timestamp,
        statusText: 'MINED (4/5)',
        statusType: 'MIDDLE',
        description: FORCED_TRANSACTION_MINED,
      }
    case 'REVERTED':
      return {
        timestamp: entry.timestamp,
        statusText: 'REVERTED',
        statusType: 'ERROR',
        description: TRANSACTION_REVERTED,
      }
    case 'INCLUDED':
      return {
        timestamp: entry.timestamp,
        statusText: 'INCLUDED (5/5)',
        statusType: 'END',
        description: (
          <IncludedWithStateUpdateId stateUpdateId={stateUpdateId} />
        ),
      }
  }
}

function getCommon(transactionHash?: Hash256, offerId?: string) {
  if (transactionHash) {
    return {
      path: `/transactions/${transactionHash.toString()}`,
      description: `Details of the ${transactionHash.toString()} forced trade transaction`,
    }
  }
  if (offerId) {
    return {
      path: `/offers/${offerId}`,
      description: `Details of the ${offerId} forced trade offer`,
    }
  }
  throw new Error('No transaction hash or offer id')
}
