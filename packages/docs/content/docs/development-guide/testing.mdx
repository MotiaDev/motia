---
title: Testing
description: Learn how to write and run tests for your Motia components
---

# Testing

Testing is an essential part of building reliable and maintainable Motia applications. Motia provides built-in support for writing and running tests to ensure the correctness of your steps, flows, and event handling logic.

## Writing Tests for Motia Components

Motia uses [Jest](https://jestjs.io/) as its testing framework. You can write tests for your Motia components using Jest's syntax and assertions.

### Step Tests

To test a step, create a test file with the same name as the step file, but with a `.test.ts` or `.test.js` extension. For example, if your step file is named `my-step.step.ts`, create a test file named `my-step.step.test.ts`.

Here's an example of a step test:

```typescript
// my-step.step.test.ts
import { createTestContext } from '@motiadev/testing'
import { handler } from './my-step.step'

describe('MyStep', () => {
  it('should emit an event with the correct data', async () => {
    const { emit, done } = createTestContext()

    await handler({ name: 'John' }, { emit })

    expect(emit).toHaveBeenCalledWith({
      type: 'my-event',
      data: { greeting: 'Hello, John!' },
    })

    done()
  })
})
```

In this example, we use the `createTestContext` function from `@motiadev/testing` to create a test context with mocked `emit` and `done` functions. We then call the step's `handler` function with test input and the mocked context. Finally, we assert that the `emit` function was called with the expected event type and data.

### Flow Tests

To test a flow, create a test file with the flow name and a `.test.ts` or `.test.js` extension. For example, if your flow is named `my-flow`, create a test file named `my-flow.test.ts`.

Here's an example of a flow test:

```typescript
// my-flow.test.ts
import { createTestFlow } from '@motiadev/testing'
import { handler as stepAHandler } from './step-a.step'
import { handler as stepBHandler } from './step-b.step'

describe('MyFlow', () => {
  it('should execute steps in the correct order', async () => {
    const flow = createTestFlow('my-flow')
      .step('step-a', stepAHandler)
      .step('step-b', stepBHandler)

    const result = await flow.execute({ name: 'Alice' })

    expect(result).toEqual({
      greeting: 'Hello, Alice!',
      message: 'Welcome to Motia!',
    })
  })
})
```

In this example, we use the `createTestFlow` function from `@motiadev/testing` to create a test flow with the specified steps. We then execute the flow with test input and assert that the final result matches the expected output.

## Running Tests Locally

To run tests locally, use the following command:

```bash
pnpm test
```

This command will run all the test files in your project and display the test results in the terminal.

You can also run tests in watch mode, which automatically re-runs the tests whenever you make changes to your code:

```bash
pnpm test --watch
```

## Best Practices

- Write tests for each step and flow to ensure comprehensive coverage.
- Use meaningful test case descriptions to clarify the purpose of each test.
- Test edge cases and error scenarios to ensure your components handle them gracefully.
- Keep your tests focused and independent to make them easier to maintain.
- Use mocks and stubs to isolate dependencies and improve test reliability.

By following these best practices and regularly running tests, you can catch bugs early, maintain code quality, and ensure the reliability of your Motia application. 