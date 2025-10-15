import type { TutorialStep } from './tutorial-types'

class Tutorial {
  public steps: TutorialStep[] = []
  private onStepsRegisteredCallbacks: (() => void)[] = []
  private onOpenCallbacks: (() => void)[] = []

  register(steps: TutorialStep[]) {
    this.steps = steps
    this.onStepsRegisteredCallbacks.forEach((callback) => callback())
  }

  onStepsRegistered(callback: () => void) {
    this.onStepsRegisteredCallbacks.push(callback)
  }

  onOpen(callback: () => void) {
    this.onOpenCallbacks.push(callback)
  }

  open() {
    this.onOpenCallbacks.forEach((callback) => callback())
  }
}

export const MotiaTutorial = new Tutorial()
