async def can_access(subscription, auth_context):
    """
    Check if the user has permission to access the RBAC message stream.
    
    Args:
        subscription: The stream subscription details
        auth_context: Authentication context containing user permissions
    
    Returns:
        bool: True if user can access the stream, False otherwise
    """
    return auth_context.get("permissions") == "python" if auth_context else False


config = {
    "name": "rbac_message_python",
    "schema": {
        "type": "object",
        "properties": {
            "message": {"type": "string"},
            "from": {"type": "string", "enum": ["user", "assistant"]},
            "status": {"type": "string", "enum": ["created", "pending", "completed"]},
        },
        "required": ["message", "from", "status"],
    },
    "baseConfig": {"storageType": "default"},
    "canAccess": can_access,
}

