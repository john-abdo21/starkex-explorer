import {
  assertUnreachable,
  CollateralAsset,
  PerpetualL2TransactionData,
} from '@explorer/shared'
import React from 'react'

import { l2TransactionTypeToText } from '../common'

export interface L2TransactionsListProps {
  transactionId: number
  contentState: 'alternative' | 'multi'
  transactions: PerpetualL2TransactionData[]
  collateralAsset: CollateralAsset
  altIndex?: number
}

export function L2TransactionsList(props: L2TransactionsListProps) {
  return (
    <div className="rounded-lg bg-gray-800">
      {props.transactions.map((transaction, index) => {
        const link = getLink(
          props.contentState,
          props.transactionId,
          index,
          props.altIndex
        )
        return (
          <a
            href={link}
            className="flex gap-6 rounded-lg py-3 px-4 hover:bg-slate-800"
            key={`${transaction.type}-${index}`}
          >
            <span className="opacity-40">#{index}</span>
            <span>{l2TransactionTypeToText(transaction.type)}</span>
          </a>
        )
      })}
    </div>
  )
}

const getLink = (
  contentState: L2TransactionsListProps['contentState'],
  transactionId: number,
  index: number,
  altIndex?: number
) => {
  const base = `/l2-transactions/${transactionId.toString()}`
  switch (contentState) {
    case 'multi':
      return (
        base +
        (altIndex !== undefined
          ? `/alternatives/${altIndex}/${index}`
          : `/${index}`)
      )
    case 'alternative':
      return base + `/alternatives/${index}`
    default:
      assertUnreachable(contentState)
  }
}