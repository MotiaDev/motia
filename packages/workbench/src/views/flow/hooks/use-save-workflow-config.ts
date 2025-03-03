import { useCallback } from 'react';

export type NodePosition = {
  [key: string]: { x: number; y: number };
};

export const useSaveWorkflowConfig = (flowId: string) => {
  const saveConfig = useCallback(async (body: NodePosition) => {
    try {
      const response = await fetch(`/flows/${flowId}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({[flowId]: body}),
      });

      if (!response.ok) {
        throw new Error(`Failed to save config: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving workflow config:', error);
      throw error;
    }
  }, [flowId]);

  return { saveConfig };
};