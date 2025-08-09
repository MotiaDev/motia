import { TutorialStep } from '@/types/tutorial'

const segmentId = 'basic'

export const endSteps: TutorialStep[] = [
  {
    elementXpath: 'div.rf__wrapper',
    segmentId,
    title: 'Congratulations 🎉',
    description: `You've completed our Motia basics tutorial!<br/><br/> You've learned about Motia's primitives, how to navigate around Workbench, and how to use core features from the Motia framework (state management, logging, and tracing).<br/><br/> We recommend you give our <a href="https://www.motia.dev/docs/getting-started/core-concepts" target="_blank">core concepts</a> a read if you wish to learn further about Motia's fundamentals.<br/><br/> Don't forget to join our <a href="https://discord.com/invite/nJFfsH5d6v" target="_blank">Discord community</a> or tag us in socials to show us what you've built with Motia.<br/><br/> We are an open source project, so feel free to raise your <a href="https://github.com/MotiaDev/motia/issues" target="_blank">issues</a> or <a href="https://github.com/MotiaDev/motia/discussions" target="_blank">suggestions</a> in our <a href="https://github.com/MotiaDev/motia" target="_blank">Github repo</a>.<br/><br/> On behalf of the Motia team, we want to say thank you for giving Motia a try!`,
    id: 'end',
  },
]
