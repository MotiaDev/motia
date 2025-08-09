import { CronConfig, Handlers } from 'motia'

export const config: CronConfig = {
  type: 'cron' as const,
  name: 'StateAuditJob',
  description: 'Runs every minute and emits a timestamp',
  cron: '*/5 * * * *', // run every hour at minute 0
  emits: ['order-audit-error', 'order-audit-warning'],
  flows: ['basic-tutorial'],
}

export const handler: Handlers['StateAuditJob'] = async ({ state, emit }) => {
  const stateValue = await state.getGroup<{
    id: number
    petId: number
    quantity: number
    shipDate: string
    status: string
    complete: boolean
  }>('orders')

  if (!Array.isArray(stateValue)) {
    await emit({
      topic: 'state-audit-error',
      data: { message: 'State value is not an array' },
    })

    return
  }

  for (const item of stateValue) {
    // check if current date is after item.shipDate
    const currentDate = new Date()
    const shipDate = new Date(item.shipDate)
    if (!item.complete && currentDate > shipDate) {
      await emit({
        topic: 'order-audit-warning',
        data: { message: 'Order is not complete and ship date is past' },
      })
    }
  }
}
