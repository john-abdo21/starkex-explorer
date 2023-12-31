import { StatusService } from '../../core/StatusService'
import { createTestApiServer } from '../../test/TestApiServer'
import { createStatusRouter } from './StatusRouter'

describe('StatusRouter', () => {
  it('/status returns aggregate status', async () => {
    const fooService = new FooService()
    const barService = new BarService()
    const statusService = new StatusService({ fooService, barService })
    const statusRouter = createStatusRouter(statusService)
    const server = createTestApiServer([statusRouter])

    await server
      .get('/status')
      .expect(200)
      .expect({
        fooService: { foo: 123 },
        barService: { bar: 'baz' },
      })
  })

  it('/status/:reporter returns reporter status', async () => {
    const fooService = new FooService()
    const barService = new BarService()
    const statusService = new StatusService({ fooService, barService })
    const statusRouter = createStatusRouter(statusService)
    const server = createTestApiServer([statusRouter])

    await server.get('/status/fooService').expect(200).expect({ foo: 123 })
  })
})

class FooService {
  getStatus() {
    return { foo: 123 }
  }
}

class BarService {
  getStatus() {
    return { bar: 'baz' }
  }
}
