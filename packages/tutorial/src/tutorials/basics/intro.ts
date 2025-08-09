import { TutorialStep } from '@/types/tutorial'

export const introStep: TutorialStep = {
  elementXpath: '//div[@id="top-panel"]',
  segmentId: 'basic',
  title: 'Welcome to Motia',
  description: `<br/><img src="https://github.com/MotiaDev/motia/raw/main/packages/docs/public/github-readme-banner.png" alt="Motia" width="100%" height="60px" /> <br/> Motia is an all-in-one framework for modern backend systems. Out of the box support for API endpoints, background jobs, scheduled tasks and agentic workflow orchestration through a unified runtime. Thanks to its event driven architecture you can run tasks in parallel, stream data to clients, or allow for seamless orchestration of flows.<br/><br/> Let's start with <b>Workbench</b>, it is a development tool provided by Motia's ecosystem, from here you'll be able to visualize your flows and observe their behavior.<br/><br/> 💡 If you are already familiar with Motia, you can skip this tutorial.`,
  id: 'intro',
  clickSelectorBeforeNext: `//button[@data-testid="flows-link"]`,
  useKeyDownEventOnClickBeforeNext: true,
  waitForSelector: `//div[@data-testid="node-apitrigger"]`,
}
