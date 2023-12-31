import { EthereumAddress, StarkKey } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'

import { Config } from '../config'
import { KeyValueStore } from '../peripherals/database/KeyValueStore'
import { fakeCollateralAsset } from '../test/fakes'
import { PageContextService } from './PageContextService'
import { UserService } from './UserService'

describe(PageContextService.name, () => {
  const perpetualConfig = {
    starkex: {
      tradingMode: 'perpetual',
      instanceName: 'dYdX',
      collateralAsset: fakeCollateralAsset,
      l2Transactions: {
        enabled: true,
      },
      blockchain: {
        chainId: 1,
      },
    },
  } as Config
  const spotConfig = {
    starkex: {
      tradingMode: 'spot',
      instanceName: 'Myria',
      l2Transactions: {
        enabled: true,
      },
      blockchain: {
        chainId: 5,
      },
    },
  } as const as Config

  describe(PageContextService.prototype.getPageContext.name, () => {
    it('should return the correct context for perpetuals', async () => {
      const givenUser = {
        address: EthereumAddress.fake(),
      }
      const mockedUserService = mockObject<UserService>({
        getUserDetails: mockFn(async () => undefined),
      })
      const mockedKvStore = mockObject<KeyValueStore>({
        findByKeyWithDefault: mockFn().resolvesTo('not-frozen'),
      })
      const pageContextService = new PageContextService(
        perpetualConfig,
        mockedUserService,
        mockedKvStore
      )

      const context = await pageContextService.getPageContext(givenUser)

      expect(context).toEqual({
        user: undefined,
        tradingMode: 'perpetual',
        showL2Transactions: perpetualConfig.starkex.l2Transactions.enabled,
        chainId: 1,
        instanceName: perpetualConfig.starkex.instanceName,
        collateralAsset: fakeCollateralAsset,
        freezeStatus: 'not-frozen',
      })
      expect(mockedUserService.getUserDetails).toHaveBeenCalledWith(givenUser)
      expect(mockedKvStore.findByKeyWithDefault).toHaveBeenCalled()
    })

    it('should return the correct context for spot', async () => {
      const givenUser = {
        address: EthereumAddress.fake(),
      }
      const mockedUserService = mockObject<UserService>({
        getUserDetails: mockFn(async () => undefined),
      })
      const mockedKvStore = mockObject<KeyValueStore>({
        findByKeyWithDefault: mockFn().resolvesTo('not-frozen'),
      })
      const pageContextService = new PageContextService(
        spotConfig,
        mockedUserService,
        mockedKvStore
      )

      const context = await pageContextService.getPageContext(givenUser)

      expect(context).toEqual({
        user: undefined,
        tradingMode: 'spot',
        showL2Transactions: spotConfig.starkex.l2Transactions.enabled,
        chainId: 5,
        instanceName: spotConfig.starkex.instanceName,
        freezeStatus: 'not-frozen',
      })
      expect(mockedUserService.getUserDetails).toHaveBeenCalledWith(givenUser)
    })
  })
  describe(PageContextService.prototype.getPageContextWithUser.name, () => {
    it('should return correct context if user is connected', async () => {
      const givenUser = {
        address: EthereumAddress.fake(),
      }
      const mockedKvStore = mockObject<KeyValueStore>({
        findByKeyWithDefault: mockFn().resolvesTo('not-frozen'),
      })
      const pageContextService = new PageContextService(
        perpetualConfig,
        mockObject<UserService>({
          getUserDetails: mockFn(async () => givenUser),
        }),
        mockedKvStore
      )
      const pageContext = {
        user: givenUser,
        tradingMode: 'perpetual',
        chainId: 1,
        showL2Transactions: false,
        instanceName: spotConfig.starkex.instanceName,
        collateralAsset: fakeCollateralAsset,
        freezeStatus: 'not-frozen',
      } as const
      pageContextService.getPageContext = mockFn(async () => pageContext)

      const context = await pageContextService.getPageContextWithUser(givenUser)

      expect(context).toEqual(pageContext)
    })

    it('should return undefined if user is not connected', async () => {
      const mockedKvStore = mockObject<KeyValueStore>({
        findByKeyWithDefault: mockFn().resolvesTo('not-frozen'),
      })
      const pageContextService = new PageContextService(
        perpetualConfig,
        mockObject<UserService>(),
        mockedKvStore
      )
      pageContextService.getPageContext = mockFn(
        async () =>
          ({
            user: undefined,
            tradingMode: 'perpetual',
            showL2Transactions: false,
            chainId: 1,
            instanceName: spotConfig.starkex.instanceName,
            collateralAsset: fakeCollateralAsset,
            freezeStatus: 'not-frozen',
          } as const)
      )
      const context = await pageContextService.getPageContextWithUser({})

      expect(context).toEqual(undefined)
    })
  })
  describe(
    PageContextService.prototype.getPageContextWithUserAndStarkKey.name,
    () => {
      it('should return correct context if user is connected and has a stark key', async () => {
        const givenUser = {
          address: EthereumAddress.fake(),
          starkKey: StarkKey.fake(),
        }
        const mockedKvStore = mockObject<KeyValueStore>({
          findByKeyWithDefault: mockFn().resolvesTo('not-frozen'),
        })
        const pageContextService = new PageContextService(
          perpetualConfig,
          mockObject<UserService>({
            getUserDetails: mockFn(async () => givenUser),
          }),
          mockedKvStore
        )
        const pageContext = {
          user: givenUser,
          tradingMode: 'perpetual',
          chainId: 1,
          showL2Transactions: false,
          instanceName: spotConfig.starkex.instanceName,
          collateralAsset: fakeCollateralAsset,
          freezeStatus: 'not-frozen',
        } as const
        pageContextService.getPageContextWithUser = mockFn(
          async () => pageContext
        )
        const context =
          await pageContextService.getPageContextWithUserAndStarkKey(givenUser)

        expect(context).toEqual(pageContext)
      })

      it('should return undefined if user is not connected', async () => {
        const pageContextService = new PageContextService(
          perpetualConfig,
          mockObject<UserService>(),
          mockObject<KeyValueStore>()
        )
        pageContextService.getPageContextWithUser = mockFn(
          async () => undefined
        )
        const context =
          await pageContextService.getPageContextWithUserAndStarkKey({})

        expect(context).toEqual(undefined)
      })

      it('should return undefined if user is connected but does not have a stark key', async () => {
        const givenUser = {
          address: EthereumAddress.fake(),
        }
        const mockedKvStore = mockObject<KeyValueStore>({
          findByKeyWithDefault: mockFn().resolvesTo('not-frozen'),
        })
        const pageContextService = new PageContextService(
          perpetualConfig,
          mockObject<UserService>({
            getUserDetails: mockFn(async () => givenUser),
          }),
          mockedKvStore
        )
        const pageContext = {
          user: givenUser,
          tradingMode: 'perpetual',
          chainId: 1,
          showL2Transactions: false,
          instanceName: spotConfig.starkex.instanceName,
          collateralAsset: fakeCollateralAsset,
          freezeStatus: 'not-frozen',
        } as const
        pageContextService.getPageContextWithUser = mockFn(
          async () => pageContext
        )
        const context =
          await pageContextService.getPageContextWithUserAndStarkKey(givenUser)

        expect(context).toEqual(undefined)
      })
    }
  )
  describe(PageContextService.prototype.getCollateralAsset.name, () => {
    it('should return the collateral asset for perpetuals', () => {
      const mockedKvStore = mockObject<KeyValueStore>({
        findByKeyWithDefault: mockFn().resolvesTo('not-frozen'),
      })
      const pageContextService = new PageContextService(
        perpetualConfig,
        mockObject<UserService>(),
        mockedKvStore
      )
      const pageContext = {
        user: undefined,
        tradingMode: 'perpetual',
        showL2Transactions: false,
        chainId: 5,
        instanceName: spotConfig.starkex.instanceName,
        collateralAsset: fakeCollateralAsset,
        freezeStatus: 'not-frozen',
      } as const

      const collateralAsset = pageContextService.getCollateralAsset(pageContext)

      expect(collateralAsset).toEqual(fakeCollateralAsset)
    })

    it('should return undefined for spot', () => {
      const mockedKvStore = mockObject<KeyValueStore>({
        findByKeyWithDefault: mockFn().resolvesTo('not-frozen'),
      })
      const pageContextService = new PageContextService(
        spotConfig,
        mockObject<UserService>(),
        mockedKvStore
      )
      const pageContext = {
        user: undefined,
        tradingMode: 'spot',
        showL2Transactions: false,
        chainId: 5,
        instanceName: spotConfig.starkex.instanceName,
        freezeStatus: 'not-frozen',
      } as const

      const collateralAsset = pageContextService.getCollateralAsset(pageContext)

      expect(collateralAsset).toEqual(undefined)
    })
  })
})
