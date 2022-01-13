import { expect } from 'chai'

import { DecodingError } from '../src'
import { MIN_INT } from '../src/constants'
import { encodeAssetId } from '../src/encodeAssetId'
import { readFundingEntries } from '../src/readFundingEntries'
import { ByteWriter } from './ByteWriter'
import { readToDecode } from './readToDecode'

describe('readFundingEntries', () => {
  const decode = readToDecode(readFundingEntries)

  it('fails for empty data', () => {
    expect(() => decode('')).to.throw(DecodingError, 'Went out of bounds')
  })

  it('can read zero entries', () => {
    const writer = new ByteWriter().writeNumber(0, 32)
    expect(decode(writer.getBytes())).to.deep.equal([])
  })

  it('can read an entry without indices', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32)
      .writeNumber(0, 32)
      .writeNumber(1234, 32)
    expect(decode(writer.getBytes())).to.deep.equal([
      {
        indices: [],
        timestamp: 1234n,
      },
    ])
  })

  it('can read an entry with indices', () => {
    const writer = new ByteWriter()
      .writeNumber(1, 32)
      .writeNumber(2, 32)
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(1n - MIN_INT, 32)
      .writePadding(17)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(-50n - MIN_INT, 32)
      .writeNumber(5678, 32)
    expect(decode(writer.getBytes())).to.deep.equal([
      {
        indices: [
          { assetId: 'ETH-9', value: 1n },
          { assetId: 'BTC-10', value: -50n },
        ],
        timestamp: 5678n,
      },
    ])
  })

  it('can read multiple entries', () => {
    const writer = new ByteWriter()
      .writeNumber(2, 32)
      .writeNumber(0, 32)
      .writeNumber(1234, 32)
      .writeNumber(2, 32)
      .writePadding(17)
      .write(encodeAssetId('ETH-9'))
      .writeNumber(1n - MIN_INT, 32)
      .writePadding(17)
      .write(encodeAssetId('BTC-10'))
      .writeNumber(-50n - MIN_INT, 32)
      .writeNumber(5678, 32)
    expect(decode(writer.getBytes())).to.deep.equal([
      {
        indices: [],
        timestamp: 1234n,
      },
      {
        indices: [
          { assetId: 'ETH-9', value: 1n },
          { assetId: 'BTC-10', value: -50n },
        ],
        timestamp: 5678n,
      },
    ])
  })
})