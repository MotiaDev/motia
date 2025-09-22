import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'InventoryManager',
  description: 'Manages user inventory using atomic array operations and monitors inventory changes',
  triggers: [
    {
      type: 'state',
      key: 'user.inventory',
      condition: (value: unknown) => Array.isArray(value),
    },
  ],
  emits: [],
  flows: ['user-lifecycle'],
  virtualSubscribes: ['user.inventory'],
  virtualEmits: [
    { topic: 'user.notifications', label: 'Inventory notifications added' },
    { topic: 'user.stats', label: 'Inventory stats updated' },
  ],
}

export const handler: Handlers['InventoryManager'] = async (input, { state, logger, traceId }) => {
  const { userId, key, value } = input

  try {
    // Only process inventory changes
    if (key !== 'user.inventory' || !Array.isArray(value)) {
      return
    }

    const inventorySize = value.length

    // Check for inventory milestones and manage inventory size
    if (inventorySize > 20) {
      // Inventory is getting too large, remove oldest items using shift
      const itemsToRemove = inventorySize - 20
      const removedItems = []
      
      for (let i = 0; i < itemsToRemove; i++) {
        const removedItem = await state.shift(userId, 'user.inventory')
        if (removedItem) {
          removedItems.push(removedItem)
        }
      }

      // Add notification about inventory cleanup
      const cleanupNotification = {
        type: 'inventory_cleanup',
        message: `📦 Inventory cleaned! Removed ${removedItems.length} old items to make room for new ones.`,
        timestamp: new Date().toISOString(),
        removedCount: removedItems.length,
        removedItems: removedItems.map(item => item.id || 'unknown')
      }
      
      await state.push(userId, 'user.notifications', cleanupNotification)

      logger.info('Inventory cleaned up', {
        userId,
        originalSize: inventorySize,
        removedCount: removedItems.length,
        newSize: 20
      })
    }

    // Check for inventory milestones
    let milestoneNotification = null
    if (inventorySize === 10) {
      milestoneNotification = {
        type: 'inventory_milestone',
        message: '🎒 Inventory milestone reached! You now have 10 items.',
        timestamp: new Date().toISOString(),
        milestone: '10_items',
        inventorySize
      }
    } else if (inventorySize === 25) {
      milestoneNotification = {
        type: 'inventory_milestone',
        message: '🎒 Inventory milestone reached! You now have 25 items.',
        timestamp: new Date().toISOString(),
        milestone: '25_items',
        inventorySize
      }
    } else if (inventorySize === 50) {
      milestoneNotification = {
        type: 'inventory_milestone',
        message: '🎒 Inventory milestone reached! You now have 50 items!',
        timestamp: new Date().toISOString(),
        milestone: '50_items',
        inventorySize
      }
    }

    // Add milestone notification if applicable
    if (milestoneNotification) {
      await state.push(userId, 'user.notifications', milestoneNotification)
    }

    // Update inventory statistics using setField
    const stats = {
      inventorySize: value.length,
      lastUpdated: new Date().toISOString(),
      recentItems: value.slice(-3) // Last 3 items
    }

    await state.setField(userId, 'user.stats', 'inventory', stats)

    // Check for empty inventory
    if (value.length === 0) {
      const emptyNotification = {
        type: 'inventory_empty',
        message: '📦 Your inventory is empty! Consider adding some items.',
        timestamp: new Date().toISOString(),
        inventorySize: 0
      }
      
      await state.push(userId, 'user.notifications', emptyNotification)
    }

    logger.info('Inventory managed', {
      userId,
      inventorySize: value.length,
      milestone: milestoneNotification?.milestone || null,
      cleaned: inventorySize > 20
    })

  } catch (error: unknown) {
    logger.error('Inventory manager failed', { userId, error })
  }
}
