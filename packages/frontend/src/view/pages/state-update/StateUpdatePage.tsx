import { PageContext } from '@explorer/shared'
import React from 'react'

import { CountBadge } from '../../components/CountBadge'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TablePreview } from '../../components/table/TablePreview'
import { L2TransactionsTable } from '../../components/tables/l2-transactions/L2TransactionsTable'
import { PriceEntry, PricesTable } from '../../components/tables/PricesTable'
import {
  TransactionEntry,
  TransactionsTable,
} from '../../components/tables/TransactionsTable'
import { Tabs } from '../../components/Tabs'
import { reactToHtml } from '../../reactToHtml'
import { PerpetualL2TransactionEntry } from '../l2-transaction/common'
import {
  getBalanceChangeTableProps,
  getL2TransactionTableProps,
  getTransactionTableProps,
} from './common'
import {
  StateUpdateBalanceChangeEntry,
  StateUpdateBalanceChangesTable,
} from './components/StateUpdateBalanceChangesTable'
import {
  StateUpdateStats,
  StateUpdateStatsProps,
} from './components/StateUpdateStats'

interface StateUpdatePageProps extends StateUpdateStatsProps {
  context: PageContext
  balanceChanges: StateUpdateBalanceChangeEntry[]
  totalBalanceChanges: number
  priceChanges?: PriceEntry[]
  transactions: TransactionEntry[]
  totalTransactions: number
  l2Transactions: PerpetualL2TransactionEntry[]
  totalL2Transactions: number
}

export function renderStateUpdatePage(props: StateUpdatePageProps) {
  return reactToHtml(<StateUpdatePage {...props} />)
}

function StateUpdatePage(props: StateUpdatePageProps) {
  const {
    title: l2TransactionsTableTitle,
    ...l2TransactionsTablePropsWithoutTitle
  } = getL2TransactionTableProps(props.id)
  const {
    title: balanceChangesTableTitle,
    ...balanceChangesTablePropsWithoutTitle
  } = getBalanceChangeTableProps(props.id)
  const { title: transactionTableTitle, ...transactionTablePropsWithoutTitle } =
    getTransactionTableProps(props.id)

  return (
    <Page
      path={`/state-update/${props.id}`}
      description="Show state update details, including balance changes, transactions and prices"
      context={props.context}
    >
      <ContentWrapper className="flex flex-col gap-12">
        <StateUpdateStats {...props} />
        <Tabs
          items={[
            {
              id: 'balance-changes',
              name: balanceChangesTableTitle,
              accessoryRight: <CountBadge count={props.totalBalanceChanges} />,
              content: (
                <TablePreview
                  viewAllPosition="bottom"
                  {...balanceChangesTablePropsWithoutTitle}
                  visible={props.balanceChanges.length}
                >
                  <StateUpdateBalanceChangesTable
                    tradingMode={props.context.tradingMode}
                    balanceChanges={props.balanceChanges}
                  />
                </TablePreview>
              ),
            },
            ...(props.context.showL2Transactions
              ? [
                  {
                    id: 'l2-transactions',
                    name: l2TransactionsTableTitle,
                    accessoryRight: (
                      <CountBadge count={props.totalL2Transactions} />
                    ),
                    content: (
                      <TablePreview
                        viewAllPosition="bottom"
                        {...l2TransactionsTablePropsWithoutTitle}
                        visible={props.l2Transactions.length}
                      >
                        <L2TransactionsTable
                          transactions={props.l2Transactions}
                          context={props.context}
                        />
                      </TablePreview>
                    ),
                  },
                ]
              : []),
            {
              id: 'transactions',
              name: transactionTableTitle,
              accessoryRight: <CountBadge count={props.totalTransactions} />,
              content: (
                <TablePreview
                  viewAllPosition="bottom"
                  {...transactionTablePropsWithoutTitle}
                  visible={props.transactions.length}
                >
                  <TransactionsTable
                    transactions={props.transactions}
                    hideAge
                  />
                </TablePreview>
              ),
            },
            ...(props.priceChanges
              ? [
                  {
                    id: 'prices',
                    name: 'Prices',
                    accessoryRight: (
                      <CountBadge count={props.priceChanges.length} />
                    ),
                    content: <PricesTable prices={props.priceChanges} />,
                  },
                ]
              : []),
          ]}
        />
      </ContentWrapper>
    </Page>
  )
}
