import { Button } from '../components/ui/button'

export const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen gap-10 bg-gradient-to-r from-background via-background to-muted">
      <h1 className="text-5xl font-extrabold max-w-[600px] text-center text-foreground">
        Code-first framework for intelligent workflows
      </h1>

      <div className="max-w-[600px] text-center text-xl font-medium text-muted-foreground">
        Write in any language. Automate anything. From AI agents to backend automation, Motia runs event-driven
        workflows with zero overhead.
      </div>

      <div className="p-[1px] min-w-[600px] rounded-lg shadow-lg border border-border">
        <div className="rounded-lg bg-card p-8 font-semibold text-xl min-h-[100px] flex items-center">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-primary">$</span>
            <span className="text-card-foreground">npx motia generate step</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 items-center">
        <span className="text-muted-foreground text-xl">or</span>
        <a href="https://motia.dev/docs" target="_blank">
          <Button size="lg" className="text-xl py-6 px-8">
            Read developer docs
          </Button>
        </a>
      </div>
    </div>
  )
}
