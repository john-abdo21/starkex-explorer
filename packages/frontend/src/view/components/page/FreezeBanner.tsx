import { FreezeStatus } from '@explorer/shared'
import React from 'react'

export function FreezeBanner({ freezeStatus }: { freezeStatus: FreezeStatus }) {
  if (freezeStatus === 'freezable') {
    return (
      <div className="sticky top-0 z-50 flex items-center justify-center gap-4 bg-brand px-6 py-0.5 text-center text-white">
        <span>
          This exchange can be frozen due to inactivity of the operator.
        </span>
        <a href="/freeze" className="underline">
          Read more
        </a>
      </div>
    )
  }
  if (freezeStatus === 'frozen') {
    return (
      <div className="sticky top-0 z-50 flex items-center justify-center gap-4 bg-red-500 px-6 py-0.5 text-center text-white">
        <span>This exchange is frozen and no longer operates normally. </span>
      </div>
    )
  }
  return null
}
