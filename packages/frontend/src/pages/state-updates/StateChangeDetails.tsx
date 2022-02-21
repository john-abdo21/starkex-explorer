import React from 'react'
import { Page } from '../common/Page'
import { Footer } from '../common/Footer'
import { Navbar } from '../common/Navbar'
import { StateChangeDetailsProps } from './StateChangeDetailsProps'

export function StateChangeDetails({
  hash,
  positions,
  timestamp: _timestamp,
}: StateChangeDetailsProps) {
  return (
    <Page
      title={`L2BEAT dYdX Explorer | ${hash.toString()}`}
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
    >
      <main className="px-4 max-w-5xl mx-auto">
        <Navbar />
        <div className="bg-white border-2 border-black p-2">
          <h1 className="bg-zinc-100 text-lg p-2 w-full flex justify-between">
            <span>Hash</span>
            <span>{hash}</span>
          </h1>
          <div className="bg-zinc-100 text-center p-2 border border-black mt-2">
            Positions
          </div>
          <ul>
            {positions.map(
              ({ balances, collateralBalance, positionId, publicKey }, i) => (
                <li key={i} className="my-4">
                  <a
                    className="w-full grid gap-2 grid-cols-[auto_1fr_auto]"
                    href={`/positions/${positionId}`}
                  >
                    <div className="w-12 h-12 bg-zinc-200 rounded-full" />
                    <div>
                      <div className="text-blue-700">{publicKey}</div>
                      <div className="font-semibold">
                        Collateral balance: {collateralBalance.toString()}
                      </div>
                      <dl>
                        {balances.map(({ assetId, balance }) => (
                          <div key={`${assetId}`}>
                            <dt className="inline text-zinc-600">
                              {assetId}:{' '}
                            </dt>
                            <dd className="inline ml-1">
                              {balance.toString()}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </a>
                </li>
              )
            )}
          </ul>
        </div>
        <Footer />
      </main>
    </Page>
  )
}
