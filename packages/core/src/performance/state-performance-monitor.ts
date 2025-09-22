/**
 * Performance monitoring for state operations
 * Tracks operation times, lock contention, and provides performance metrics
 */

import { performance } from 'node:perf_hooks'

export interface PerformanceMetrics {
  operationCounts: Record<string, number>
  operationTimes: Record<string, number[]>
  lockContention: Record<string, number>
  averageOperationTime: Record<string, number>
  totalOperations: number
  startTime: number
}

export class StatePerformanceMonitor {
  private metrics: PerformanceMetrics = {
    operationCounts: {},
    operationTimes: {},
    lockContention: {},
    averageOperationTime: {},
    totalOperations: 0,
    startTime: Date.now()
  }

  private isEnabled: boolean = false

  constructor(enableMonitoring: boolean = false) {
    this.isEnabled = enableMonitoring
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * Track the start of an operation
   */
  startOperation(operation: string): () => void {
    if (!this.isEnabled) return () => {}

    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      this.recordOperation(operation, duration)
    }
  }

  /**
   * Record a completed operation with its duration
   */
  recordOperation(operation: string, duration: number): void {
    if (!this.isEnabled) return

    // Update operation counts
    this.metrics.operationCounts[operation] = (this.metrics.operationCounts[operation] || 0) + 1
    this.metrics.totalOperations++

    // Update operation times
    if (!this.metrics.operationTimes[operation]) {
      this.metrics.operationTimes[operation] = []
    }
    this.metrics.operationTimes[operation].push(duration)

    // Keep only the last 1000 measurements per operation to prevent memory leaks
    if (this.metrics.operationTimes[operation].length > 1000) {
      this.metrics.operationTimes[operation] = this.metrics.operationTimes[operation].slice(-1000)
    }

    // Update average operation time
    const times = this.metrics.operationTimes[operation]
    this.metrics.averageOperationTime[operation] = times.reduce((sum, time) => sum + time, 0) / times.length
  }

  /**
   * Record lock contention for a key
   */
  recordLockContention(key: string): void {
    if (!this.isEnabled) return
    this.metrics.lockContention[key] = (this.metrics.lockContention[key] || 0) + 1
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    uptime: number
    totalOperations: number
    operationsPerSecond: number
    averageOperationTimes: Record<string, number>
    mostContendedKeys: Array<{ key: string; contention: number }>
    slowestOperations: Array<{ operation: string; averageTime: number }>
  } {
    const uptime = Date.now() - this.metrics.startTime
    const operationsPerSecond = this.metrics.totalOperations / (uptime / 1000)

    // Get most contended keys
    const mostContendedKeys = Object.entries(this.metrics.lockContention)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, contention]) => ({ key, contention }))

    // Get slowest operations
    const slowestOperations = Object.entries(this.metrics.averageOperationTime)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([operation, averageTime]) => ({ operation, averageTime }))

    return {
      uptime,
      totalOperations: this.metrics.totalOperations,
      operationsPerSecond,
      averageOperationTimes: this.metrics.averageOperationTime,
      mostContendedKeys,
      slowestOperations
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      operationCounts: {},
      operationTimes: {},
      lockContention: {},
      averageOperationTime: {},
      totalOperations: 0,
      startTime: Date.now()
    }
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    if (!this.isEnabled) return

    const summary = this.getSummary()
    console.log('🔍 State Performance Summary:')
    console.log(`  Uptime: ${(summary.uptime / 1000).toFixed(2)}s`)
    console.log(`  Total Operations: ${summary.totalOperations}`)
    console.log(`  Operations/sec: ${summary.operationsPerSecond.toFixed(2)}`)
    
    if (summary.slowestOperations.length > 0) {
      console.log('  Slowest Operations:')
      summary.slowestOperations.forEach(({ operation, averageTime }) => {
        console.log(`    ${operation}: ${averageTime.toFixed(3)}ms`)
      })
    }
    
    if (summary.mostContendedKeys.length > 0) {
      console.log('  Most Contended Keys:')
      summary.mostContendedKeys.forEach(({ key, contention }) => {
        console.log(`    ${key}: ${contention} contentions`)
      })
    }
  }
}

// Global performance monitor instance
export const globalStatePerformanceMonitor = new StatePerformanceMonitor(
  process.env.NODE_ENV === 'development' || process.env.MOTIA_PERFORMANCE_MONITORING === 'true'
)
