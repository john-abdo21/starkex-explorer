import { StarkKey } from '@explorer/types'

export const getUserPageProps = (starkKey: StarkKey) => ({
  path: `/users/${starkKey.toString()}`,
  description: `Details of user ${starkKey.toString()} including assets, balance changes, transactions and trade offers`,
})

export const getAssetsTableProps = (starkKey: StarkKey) => ({
  title: 'Assets',
  entryShortNamePlural: 'assets',
  entryLongNamePlural: 'assets',
  path: `/users/${starkKey.toString()}/assets`,
  description: `Assets of user ${starkKey.toString()}`,
})

export const getL2TransactionTableProps = (starkKey: StarkKey) => ({
  title: 'Transactions',
  entryShortNamePlural: 'transactions',
  entryLongNamePlural: 'transactions',
  path: `/users/${starkKey.toString()}/l2-transactions`,
  description: `Layer 2 transactions of user ${starkKey.toString()}`,
})

export const getBalanceChangeTableProps = (starkKey: StarkKey) => ({
  title: 'Balance changes',
  entryShortNamePlural: 'changes',
  entryLongNamePlural: 'balance changes',
  path: `/users/${starkKey.toString()}/balance-changes`,
  description: `Balance changes of user ${starkKey.toString()}`,
})

export const getTransactionTableProps = (starkKey: StarkKey) => ({
  title: 'Forced transactions',
  entryShortNamePlural: 'transactions',
  entryLongNamePlural: 'forced transactions',
  path: `/users/${starkKey.toString()}/transactions`,
  description: `Forced transactions of user ${starkKey.toString()}`,
})

export const getOfferTableProps = (starkKey: StarkKey) => ({
  title: 'Offers',
  entryShortNamePlural: 'offers',
  entryLongNamePlural: 'trade offers',
  path: `/users/${starkKey.toString()}/offers`,
  description: `Trade offers of user ${starkKey.toString()}`,
})
