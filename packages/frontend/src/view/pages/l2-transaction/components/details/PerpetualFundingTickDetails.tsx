import { PerpetualFundingIndex } from '@explorer/shared'
import React from 'react'

import { assetToInfo } from '../../../../../utils/assets'
import { formatTimestamp } from '../../../../../utils/formatting/formatTimestamp'
import { AssetWithLogo } from '../../../../components/AssetWithLogo'
import { TransactionField } from '../../../transaction/components/TransactionField'
import {
  l2TransactionTypeToText,
  PerpetualTransactionDetailsProps,
} from '../../common'
import { CurrentStatusField } from '../CurrentStatusField'
import { L2TransactionDetailsCard } from './TransactionDetailsCard'

export function PerpetualFundingTickDetails(
  props: PerpetualTransactionDetailsProps<'FundingTick'>
) {
  return (
    <L2TransactionDetailsCard transactionId={props.transactionId}>
      <TransactionField label="Type">
        {l2TransactionTypeToText(props.data.type)}
      </TransactionField>
      <TransactionField label="Current status">
        <CurrentStatusField stateUpdateId={props.stateUpdateId} />
      </TransactionField>
      <TransactionField label="Date (UTC)">
        {formatTimestamp(props.data.globalFundingIndices.timestamp)}
      </TransactionField>
      <TransactionField label="Funding indices">
        <div className="grid gap-6 sm:grid-cols-2">
          {props.data.globalFundingIndices.indices.map((index, i) => {
            return (
              <FundingIndexCard
                {...index}
                key={`${index.syntheticAssetId.toString()}-${i}`}
              />
            )
          })}
        </div>
      </TransactionField>
      <TransactionField label="Timestamp (UTC)">
        {props.timestamp ? formatTimestamp(props.timestamp) : '-'}
      </TransactionField>
    </L2TransactionDetailsCard>
  )
}

function FundingIndexCard(fundingIndex: PerpetualFundingIndex) {
  const assetInfo = assetToInfo({ hashOrId: fundingIndex.syntheticAssetId })
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-800 p-4">
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-500">
          Quantized funding index
        </p>
        <p className="text-xl font-semibold text-white">
          {fundingIndex.quantizedFundingIndex}
        </p>
      </div>
      <div>
        <p className="mb-2 text-right text-sm font-medium text-zinc-500">
          Asset
        </p>
        <div className="flex justify-end gap-2">
          <AssetWithLogo assetInfo={assetInfo} type="symbol" />
        </div>
      </div>
    </div>
  )
}
