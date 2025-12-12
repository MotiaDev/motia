import type http from 'http'
import net from 'net'

const MAX_PORT_ATTEMPTS = 10

const isPortAvailable = (port: number, hostname: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const testServer = net.createServer()
    testServer.once('error', () => resolve(false))
    testServer.once('listening', () => {
      testServer.close(() => resolve(true))
    })
    testServer.listen(port, hostname)
  })
}

const findAvailablePort = async (startPort: number, hostname: string): Promise<number> => {
  for (let port = startPort; port < startPort + MAX_PORT_ATTEMPTS; port++) {
    if (await isPortAvailable(port, hostname)) {
      return port
    }
  }
  throw new Error(`No available ports found in range ${startPort}-${startPort + MAX_PORT_ATTEMPTS - 1}`)
}

export const listenWithFallback = async (server: http.Server, port: number, hostname: string): Promise<number> => {
  const availablePort = await findAvailablePort(port, hostname)

  return new Promise((resolve, reject) => {
    server.once('error', (error) => {
      reject(error)
    })

    server.listen(availablePort, hostname, () => {
      resolve(availablePort)
    })
  })
}
