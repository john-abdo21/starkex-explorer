import cx from 'classnames'
import React from 'react'

import { StatRow, StatRowProps } from './StatRow'

export interface StatsTableProps {
  rows: Omit<StatRowProps, 'even'>[]
  className?: string
}

export function StatsTable({ rows, className }: StatsTableProps) {
  return (
    <div className={cx('w-full overflow-x-auto mb-8', className)}>
      <table className="whitespace-nowrap w-full">
        <tbody>
          {rows.map((stat, i) => (
            <StatRow key={i} {...stat} even={i % 2 === 0} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
