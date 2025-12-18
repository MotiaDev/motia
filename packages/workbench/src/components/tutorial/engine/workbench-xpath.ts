export const workbenchXPath = {
  sidebarContainer: '//div[@data-testid="sidebar-panel"]',
  closePanelButton: '//div[@id="app-sidebar-container"]//button[@data-testid="close-panel"]',
  bottomPanel: '//div[@id="bottom-panel"]',

  flows: {
    dropdownFlow: (flowId: string) => `//div[@data-testid="dropdown-${flowId}"]`,
    feature: (featureId: string) => `//div[@data-feature-id="${featureId}"]`,
    previewButton: (stepId: string) => `//button[@data-testid="open-code-preview-button-${stepId}"]`,
    node: (stepId: string) => `//div[@data-testid="node-${stepId}"]`,
  },

  endpoints: {
    endpointsList: '//div[@data-testid="endpoints-list"]',
    endpoint: (method: string, path: string) => `//div[@data-testid="endpoint-${method}-${path}"]`,
    callPanel: '//div[@data-testid="endpoint-details-panel"]',
    specButton: '//button[@data-testid="endpoint-spec-button"]',

    bodyTab: '//button[@data-testid="endpoint-body-tab"]',
    headersTab: '//button[@data-testid="endpoint-headers-tab"]',
    paramsTab: '//button[@data-testid="endpoint-params-tab"]',

    callTab: '//button[@data-testid="endpoint-body-tab"]', // deprecated
    response: '//div[@data-testid="endpoint-response-container"]',
    playButton: '//button[@data-testid="endpoint-play-button"]',
  },

  tracing: {
    trace: (index: number) => `(//button[contains(@class, 'motia-trace-group')])[${index}]`,
    details: '//div[@data-testid="trace-details"]',
    timeline: (index: number) => `(//div[@data-testid="trace-timeline-item"])[${index}]`,
  },

  logs: {
    container: '//div[@data-testid="logs-container"]',
    searchContainer: '//div[@data-testid="logs-search-container"]',
    traceColumn: (index: number) => `(//button[starts-with(@data-testid, 'trace-filter')])[${index}]`,
    row: '//div[@data-testid="log-row"]',
  },

  states: {
    container: '//div[@data-testid="states-container"]',
    row: (index: number) => `(//tr[starts-with(@data-testid, 'item-')])[${index}]`,
  },

  links: {
    flows: '//div[@data-testid="flows-dropdown-trigger"]',
    endpoints: '//button[@data-testid="endpoints-link"]',
    tracing: '//button[@data-testid="tracing-link"]',
    logs: '//button[@data-testid="logs-link"]',
    states: '//button[@data-testid="states-link"]',
  },
}
