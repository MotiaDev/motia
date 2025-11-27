import { CronConfig, Handlers } from 'motia'

export const config: CronConfig = {
  type: 'cron',
  cron: '0 0 * * 1', // run once every Monday at midnight
  name: 'StateAuditJob',
  description: 'Checks the state for orders that are not complete and have a ship date in the past',
  emits: ['notification'],
  flows: ['basic-tutorial'],
}

type Order = {
  id: number
  petId: number
  quantity: number
  shipDate: string
  status: string
  complete: boolean
}

export const handler: Handlers['StateAuditJob'] = async ({ logger, state, emit }) => {
  const stateValue = await state.getGroup<Order>('orders')

  for (const item of stateValue) {
    // check if current date is after item.shipDate
    const currentDate = new Date()
    const shipDate = new Date(item.shipDate)

    if (!item.complete && currentDate > shipDate) {
      logger.warn('Order is not complete and ship date is past', {
        orderId: item.id,
        shipDate: item.shipDate,
        complete: item.complete,
      })

      await emit({
        topic: 'notification',
        data: {
          email: 'test@test.com',
          templateId: 'order-audit-warning',
          templateData: {
            orderId: item.id,
            status: item.status,
            shipDate: item.shipDate,
            message: 'Order is not complete and ship date is past',
          },
        },
      })
    }
  }
}
