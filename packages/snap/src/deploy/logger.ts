import colors from 'colors'

export class Logger {
  info(message: string): void {
    console.log(colors.blue('ℹ [INFO] '), message)
  }
  
  success(message: string): void {
    console.log(colors.green('✓ [SUCCESS] '), message)
  }
  
  warning(message: string): void {
    console.log(colors.yellow('⚠ [WARNING] '), message)
  }
  
  error(message: string): void {
    console.error(colors.red('✗ [ERROR] '), message)
  }
  
  errorItem(index: number, message: string): void {
    console.error(colors.red(`  ${index}. `), message)
  }
  
  errorDetail(message: string): void {
    console.error(colors.red('     Error: '), message)
  }
  
  solution(message: string): void {
    console.error(colors.red('  - '), message)
  }
  
  uploadSuccess(path: string): void {
    this.success(`Uploaded ${path}`)
  }
  
  uploadFailed(path: string, error: string): void {
    this.error(`Failed to upload ${path}: ${error}`)
  }
  
  deploymentStarted(id: string): void {
    this.success(`Deployment started with ID: ${id}`)
  }
  
  deploymentCompleted(): void {
    this.success('Deployment process completed successfully')
  }
  
  summaryWritten(path: string): void {
    this.info(`Deployment summary written to ${path}`)
  }
  
  foundZipFiles(count: number): void {
    this.info(`Found ${count} zip files to deploy`)
  }
  
  noZipFiles(): void {
    this.warning('No zip files found to deploy')
  }
  
  deployingToEnvironment(environment: string, version: string): void {
    this.info(`Deploying to environment: ${environment}, version: ${version}`)
  }
  
  deployingFlows(count: number): void {
    this.info(`Deploying steps for ${count} flows`)
  }
  
  uploadingZipFiles(): void {
    this.info('Step 1: Uploading zip files')
  }
  
  allZipFilesUploaded(count: number): void {
    this.success(`All ${count} zip files uploaded successfully`)
  }
  
  uploadingConfig(): void {
    this.info('Step 2: Uploading steps configuration')
  }
  
  configUploaded(): void {
    this.success('Steps configuration uploaded successfully')
  }
  
  startingDeployment(): void {
    this.info('Step 3: Starting deployment')
  }
  
  uploadingFile(filename: string): void {
    this.info(`Uploading zip file: ${filename}`)
  }
}

export const logger = new Logger() 