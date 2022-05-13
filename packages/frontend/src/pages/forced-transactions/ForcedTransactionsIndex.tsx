import React from 'react'

import { Page } from '../common'
import { AssetNameCell } from '../common/AssetNameCell'
import { Pagination } from '../common/Pagination'
import { Table } from '../common/Table'
import {
  formatCurrencyUnits,
  formatHashLong,
  formatRelativeTime,
} from '../formatting'
import { ForcedTransactionsIndexProps } from './ForcedTransactionsIndexProps'

export function ForcedTransactionsIndex({
  transactions,
  params: { perPage, page },
  fullCount,
  account,
}: ForcedTransactionsIndexProps) {
  return (
    <Page
      title="L2BEAT dYdX Explorer"
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
      account={account}
    >
      <h1 className="font-sans font-bold text-2xl mb-12">
        Latest forced transactions
      </h1>
      <Pagination
        perPage={perPage}
        page={page}
        fullCount={fullCount}
        baseUrl="/forced-transactions"
      />
      <Table
        noRowsText="no forced transactions have been issued so far"
        columns={[
          { header: 'Type' },
          { header: 'Time' },
          { header: 'Status' },
          {
            header: 'Hash',
            cellFontMono: true,
            className: 'max-w-[250px]',
          },
          { header: 'Amount', numeric: true },
          { header: 'Asset' },
          { header: 'Position ID', numeric: true },
        ]}
        rows={transactions.map((transaction) => {
          const link = `/forced-transactions/${transaction.hash}`
          return {
            link,
            cells: [
              transaction.type,
              formatRelativeTime(transaction.lastUpdate),
              transaction.status,
              formatHashLong(transaction.hash),
              formatCurrencyUnits(transaction.amount, transaction.assetId),
              <AssetNameCell assetId={transaction.assetId} />,
              transaction.positionId.toString(),
            ],
          }
        })}
      />
    </Page>
  )
}