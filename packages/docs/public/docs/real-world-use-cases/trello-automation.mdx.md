---
title: Trello Card Automation
description: Build an automated card progression system for Trello boards with AI-powered summaries
---

import {
  TrelloTab,
  TrelloCodeContent,
} from "../../../components/TrelloCodeFetcher";

## Let's build a Trello automation system that:

1. Automatically progresses cards across board lists
2. Validates card completeness
3. Generates AI-powered summaries for code review
4. Integrates with Slack for notifications
5. Monitors due dates and sends overdue alerts

## Board Structure

The Trello board is organized into four main lists:

- **New Cards**: Entry point for all new cards
- **In Progress**: Active development stage
- **Needs Review**: Code review stage with AI summaries
- **Completed**: Successfully reviewed and approved cards

## The Steps

<Folder name="steps" defaultOpen>
  <File name="trello-webhook.step.ts" />
  <File name="trello-webhook-validation.step.ts" />
  <File name="validate-card-requirements.step.ts" />
  <File name="start-assigned-card.step.ts" />
  <File name="mark-card-for-review.step.ts" />
  <File name="complete-approved-card.step.ts" />
  <File name="check-overdue-cards.step.ts" />
  <File name="slack-notifier.step.ts" />
</Folder>

<Tabs
  items={[
    "webhook",
    "validation",
    "requirements",
    "assigned",
    "review",
    "completion",
    "overdue",
    "slack",
  ]}
>
  <TrelloTab tab="webhook" value="trello-webhook" />
  <TrelloTab tab="validation" value="trello-webhook-validation" />
  <TrelloTab tab="requirements" value="validate-card-requirements" />
  <TrelloTab tab="assigned" value="start-assigned-card" />
  <TrelloTab tab="review" value="mark-card-for-review" />
  <TrelloTab tab="completion" value="complete-approved-card" />
  <TrelloTab tab="overdue" value="check-overdue-cards" />
  <TrelloTab tab="slack" value="slack-notifier" />
</Tabs>

## Visual Overview

Here's how the automation flow works:

<div className="my-8">
  ![Flow: Trello Automation Steps](../img/trello-automation.png)
</div>

1. **Card Validation** → Checks for required information
2. **Progress Tracking** → Moves cards between lists
3. **Review Process** → Generates AI summaries and notifies reviewers
4. **Completion Handling** → Processes approved cards

## Try It Out

<Steps>

### Prerequisites

Make sure you have:

- Trello account with API access
- Node.js installed
- Slack workspace (for notifications)
- OpenAI API key (for AI summaries)

### Clone the Repository

```bash
git clone git@github.com:MotiaDev/motia-examples.git
cd examples/trello-flow
```

### Install Dependencies

```bash
pnpm install
```

### Configure Environment Variables

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Update your `.env` with the following credentials:

```bash
TRELLO_API_KEY=your_trello_api_key
TRELLO_TOKEN=your_trello_token

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=your_openai_model

SLACK_WEBHOOK_URL=your_slack_webhook_url

TRELLO_NEW_TASKS_LIST_ID=your_new_tasks_list_id
TRELLO_IN_PROGRESS_LIST_ID=your_in_progress_list_id
TRELLO_NEEDS_REVIEW_LIST_ID=your_needs_review_list_id
TRELLO_COMPLETED_LIST_ID=your_completed_list_id
```

### Set Up Trello Board

1. Create a new Trello board with these lists:

   - New Tasks
   - In Progress
   - Needs Review
   - Completed

2. Add a custom field:
   - Status (dropdown: Todo, In Progress, Done)

### Run the Application

```bash
pnpm dev
```

### Test the Flow

1. Create a new card in the "New Tasks" list
2. Assign a member to see it move to "In Progress"
3. Add an "approved" comment to see it move to "Completed"
4. Check Slack for notifications

</Steps>

<Callout type="info">
  For more detailed setup instructions and configuration options, check out the
  [full
  documentation](https://github.com/MotiaDev/motia-examples/tree/main/examples/trello-flow).
</Callout>{" "}
