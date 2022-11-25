import { expect } from 'earljs'

import {
  PerpetualBatchResponse,
  SpotBatchResponse,
} from '../../../src/peripherals/starkware/schema'
import { EXAMPLE_PERPETUAL_BATCH, EXAMPLE_SPOT_BATCH } from './data'

describe('PerpetualBatchResponse', () => {
  it('can parse real data', () => {
    const fn = () => PerpetualBatchResponse.parse(EXAMPLE_PERPETUAL_BATCH)
    expect(fn).not.toThrow()
  })

  it('can parse a non-existent update', () => {
    expect(() => PerpetualBatchResponse.parse({ update: null })).not.toThrow()
  })
})

describe('SpotBatchResponse', () => {
  it('can parse real data', () => {
    const fn = () => SpotBatchResponse.parse(EXAMPLE_SPOT_BATCH)
    expect(fn).not.toThrow()
  })

  it('can parse a non-existent update', () => {
    expect(() => SpotBatchResponse.parse({ update: null })).not.toThrow()
  })
})