import { Header } from './header/header'

export const NotFoundPage = () => (
  <div className="grid grid-rows-[auto_1fr] h-screen bg-background text-foreground">
    <Header />
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">404 – Page Not Found</h1>
      <p className="text-lg opacity-80 mb-6">This route doesn’t exist.</p>
    </div>
  </div>
)
