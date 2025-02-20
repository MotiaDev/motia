import { Logger } from "@motiadev/core";
import { MockFlowContext } from "./types";


export const createMockLogger = () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  }
  return mockLogger as unknown as jest.Mocked<Logger>
}

export const setupLoggerMock = () => {
  ;(Logger as jest.MockedClass<typeof Logger>).mockImplementation(
    () => ({ info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn(), log: jest.fn() }) as any,
  )
}

export const createMockContext = (logger = createMockLogger(), emit = jest.fn()): MockFlowContext => {
  return {
    logger,
    emit,
    traceId: '',
    state: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    },
  }
}
