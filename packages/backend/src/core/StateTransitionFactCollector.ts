import { utils } from 'ethers'

import {
  StateTransitionFactRecord,
  StateTransitionFactRepository,
} from '../peripherals/database/StateTransitionFactsRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber, BlockRange } from '../peripherals/ethereum/types'

const PERPETUAL_ADDRESS = '0xD54f502e184B6B739d7D27a6410a67dc462D69c8'

const PERPETUAL_ABI = new utils.Interface([
  'event LogStateTransitionFact(bytes32 stateTransitionFact)',
])

/** @internal exported only for tests */
export const LOG_STATE_TRANSITION_FACT = PERPETUAL_ABI.getEventTopic(
  'LogStateTransitionFact'
)

export class StateTransitionFactCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly stateTransitionFactRepository: StateTransitionFactRepository
  ) {}

  async collect(blockRange: BlockRange): Promise<StateTransitionFactRecord[]> {
    const logs = await this.ethereumClient.getLogs({
      address: PERPETUAL_ADDRESS,
      fromBlock: blockRange.from,
      toBlock: blockRange.to,
      topics: [LOG_STATE_TRANSITION_FACT],
    })

    const records = logs.map((log): StateTransitionFactRecord => {
      const event = PERPETUAL_ABI.parseLog(log)
      return {
        blockNumber: log.blockNumber,
        hash: event.args.stateTransitionFact,
      }
    })

    await this.stateTransitionFactRepository.add(records)
    return records
  }

  async discard({ from }: { from: BlockNumber }) {
    await this.stateTransitionFactRepository.deleteAllAfter(from - 1)
  }
}