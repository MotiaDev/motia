import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'UserGroupManager',
  description: 'Manages user groups and demonstrates getGroup atomic operation',
  triggers: [
    {
      type: 'state',
      key: 'user.registered',
      condition: (value: unknown) => value === true,
    },
  ],
  emits: [],
  flows: ['user-lifecycle'],
  virtualSubscribes: ['user.registration'],
  virtualEmits: [
    { topic: 'user.profile', label: 'Group membership added to profile' },
    { topic: 'user.notifications', label: 'Group welcome notification added' },
  ],
}

export const handler: Handlers['UserGroupManager'] = async (input, { state, logger, traceId }) => {
  const { userId, key, value } = input

  try {
    // Only process user registration events
    if (key !== 'user.registered' || value !== true) {
      return
    }

    // Add user to a group using set with group key
    const groupId = 'active_users'
    const userData = {
      id: userId,
      registeredAt: new Date().toISOString(),
      status: 'active'
    }

    await state.set(groupId, userId, userData)

    // Use getGroup to retrieve all users in the group
    const allUsersInGroup = await state.getGroup(groupId)
    
    // Add group statistics to user profile
    await state.setField(userId, 'user.profile', 'groupMembership', {
      groupId,
      joinedAt: new Date().toISOString(),
      totalMembers: allUsersInGroup.length
    })

    // Add notification about group membership
    const groupNotification = {
      type: 'group_membership',
      message: `👥 Welcome to the ${groupId} group! You're member #${allUsersInGroup.length}`,
      timestamp: new Date().toISOString(),
      groupId,
      memberCount: allUsersInGroup.length
    }
    
    await state.push(userId, 'user.notifications', groupNotification)

    logger.info('User added to group', {
      userId,
      groupId,
      totalMembers: allUsersInGroup.length,
      userData
    })

  } catch (error: unknown) {
    logger.error('User group manager failed', { userId, error })
  }
}
