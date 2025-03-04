# @motiadev/workbench

A web-based interface for building, visualizing, and managing Motia workflows.

## Overview

`@motiadev/workbench` provides a powerful visual interface for Motia workflows, offering:

- Flow visualization with interactive diagrams
- Real-time log monitoring
- State inspection and management
- API testing capabilities

## Installation

```bash
npm install @motiadev/workbench
# or
yarn add @motiadev/workbench
# or
pnpm add @motiadev/workbench
```

## Usage

The Workbench is automatically integrated when you run a Motia project in development mode:

```bash
npx motia dev
```

This starts the development server and makes the Workbench available at `http://localhost:3000` by default.

## Features

### Flow Visualization

Visualize your workflows as interactive diagrams, showing the connections between steps and the flow of events through your application.

### Log Monitoring

Monitor logs in real-time with filtering capabilities, log level indicators, and detailed log inspection.

### State Management

Inspect and manage application state, with support for viewing complex nested objects and state changes over time.

### API Testing

Test API endpoints directly from the Workbench interface, with support for different HTTP methods and request bodies.

## Components

The package exports several components that can be used to customize the visualization of your workflows:

```typescript
import { 
  EventNode, 
  ApiNode, 
  NoopNode, 
  BaseNode, 
  BaseHandle 
} from '@motiadev/workbench'
```

### Node Components

- `EventNode`: Visualizes event-based steps
- `ApiNode`: Visualizes API endpoint steps
- `NoopNode`: A placeholder node with no specific functionality
- `BaseNode`: Base component for creating custom node types
- `BaseHandle`: Connection point component for nodes

## Customization

You can customize the appearance and behavior of the Workbench by creating custom node components:

```typescript
import { BaseNode, Position } from '@motiadev/workbench'

export const CustomNode = ({ data, ...props }) => {
  return (
    <BaseNode 
      {...props} 
      title="Custom Node" 
      color="#8B5CF6"
    >
      <div className="p-4">
        {data.customContent}
      </div>
    </BaseNode>
  )
}
```

## Technical Details

- Built with React and TypeScript
- Uses [XY Flow](https://xyflow.com/) for flow visualization
- Styled with Tailwind CSS and shadcn/ui components
- Supports real-time updates via WebSockets

## License

This package is part of the Motia framework and is licensed under the same terms.
