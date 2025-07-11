import { spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

export interface VenvConfig {
  baseDir: string;
  isVerbose?: boolean;
}

const execAsync = (command: string, args: string[], options: any = {}): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ['pipe', 'pipe', 'pipe'] });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
};

export async function installLambdaPythonPackages({ baseDir, isVerbose = false }: VenvConfig): Promise<void> {
  // Validate and sanitize baseDir
  const sanitizedBaseDir = path.resolve(baseDir);
  
  // Ensure baseDir is within expected bounds (basic path traversal protection)
  if (!sanitizedBaseDir.includes(process.cwd())) {
    throw new Error('Invalid base directory path');
  }
  
  const pythonPath = 'python3';
  const pipPath = 'pip3';
  
  try {
    // Install packages using spawn instead of exec to prevent command injection
    const installArgs = ['install', '-r', path.join(sanitizedBaseDir, 'requirements.txt'), '-t', sanitizedBaseDir];
    
    if (isVerbose) {
      installArgs.push('--verbose');
    }
    
    await execAsync(pipPath, installArgs, { cwd: sanitizedBaseDir });
    
    if (isVerbose) {
      console.log('Python packages installed successfully');
    }
  } catch (error) {
    throw new Error(`Failed to install Python packages: ${error}`);
  }
}
