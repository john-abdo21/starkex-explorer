import { Interface } from '@ethersproject/abi'
import { StarkKey } from '@explorer/types'

const coder = new Interface([
  'function fullWithdrawalRequest(uint256 ownerKey, uint256 vaultId)',
])

export interface SpotForcedWithdrawalRequest {
  ownerKey: StarkKey
  vaultId: bigint
}

export function decodeSpotForcedWithdrawalRequest(
  data: string
): SpotForcedWithdrawalRequest | undefined {
  try {
    const decoded = coder.decodeFunctionData('fullWithdrawalRequest', data)
    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    return {
      ownerKey: StarkKey.from(decoded.ownerKey),
      vaultId: BigInt(decoded.vaultId),
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument */
  } catch {
    return
  }
}

export function encodeSpotForcedWithdrawalRequest(
  data: SpotForcedWithdrawalRequest
) {
  return coder.encodeFunctionData('fullWithdrawalRequest', [
    data.ownerKey,
    data.vaultId.toString(),
  ])
}
