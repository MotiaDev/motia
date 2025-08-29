#!/usr/bin/env python3
"""
Improved Python builder for package deployment.
Detects imports using AST, tracks internal file dependencies, and provides package information.
"""

import os
import sys
import json
import ast
import importlib.metadata
from pathlib import Path
from typing import Set, List, Dict, Optional, Any
from dataclasses import dataclass, asdict

NODEIPCFD = int(os.environ["NODE_CHANNEL_FD"])

@dataclass
class DependencyAnalysis:
    """Results of dependency analysis"""
    packages: List[str]  # External packages
    files: List[str]     # Internal Python files (relative paths)
    
    def to_dict(self):
        return asdict(self)

class PythonAnalyzer:
    """Analyzes Python files to extract dependencies"""
    
    def __init__(self, entry_file: str, project_root: str = None):
        self.entry_file = Path(entry_file).absolute()
        self.project_root = Path(project_root or self.entry_file.parent).absolute()
        self.analyzed_files: Set[Path] = set()
        self.external_packages: Set[str] = set()
        self.internal_files: Set[Path] = set()
        
        # Get standard library modules
        self.stdlib_modules = self._get_stdlib_modules()
        
    def _get_stdlib_modules(self) -> Set[str]:
        """Get set of standard library module names"""
        if hasattr(sys, 'stdlib_module_names'):
            return set(sys.stdlib_module_names)
        
        # Fallback for older Python versions
        stdlib = set(sys.builtin_module_names)
        
        # Add known standard library modules
        import distutils.sysconfig as sysconfig
        std_lib_path = sysconfig.get_python_lib(standard_lib=True)
        
        try:
            for item in os.listdir(std_lib_path):
                if item.endswith('.py'):
                    stdlib.add(item[:-3])
                elif os.path.isdir(os.path.join(std_lib_path, item)) and not item.startswith('_'):
                    stdlib.add(item)
        except OSError:
            pass
            
        return stdlib
        
    def analyze(self) -> DependencyAnalysis:
        """Main analysis entry point"""
        # Always include the entry file itself
        self.internal_files.add(self.entry_file)
        
        # Analyze the entry file and its dependencies
        self._analyze_file(self.entry_file)
        
        # Convert internal files to relative paths from project root
        relative_files = []
        for file_path in self.internal_files:
            try:
                rel_path = file_path.relative_to(self.project_root)
                relative_files.append(str(rel_path))
            except ValueError:
                # File is outside project root, include absolute path
                relative_files.append(str(file_path))
                
        return DependencyAnalysis(
            packages=sorted(list(self.external_packages)),
            files=sorted(relative_files)
        )
        
    def _analyze_file(self, file_path: Path) -> None:
        """Recursively analyze a Python file and its imports"""
        if file_path in self.analyzed_files or not file_path.exists():
            return
            
        self.analyzed_files.add(file_path)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            tree = ast.parse(content, filename=str(file_path))
            
            # Walk through all nodes in the AST
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        self._process_import(alias.name, file_path)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        self._process_import(node.module, file_path, node.level)
                    # Handle "from . import x" case
                    elif node.level > 0:
                        self._process_relative_import(file_path, node.level, node.names)
                        
        except (SyntaxError, UnicodeDecodeError) as e:
            print(f"Warning: Could not parse {file_path}: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Warning: Error analyzing {file_path}: {e}", file=sys.stderr)
            
    def _process_import(self, module_name: str, from_file: Path, level: int = 0) -> None:
        """Process an import statement"""
        if not module_name:
            return
            
        # Handle relative imports
        if level > 0:
            module_name = self._resolve_relative_import(module_name, from_file, level)
            if not module_name:
                return
                
        # Get the top-level package name
        package_name = module_name.split('.')[0]
        
        # Skip invalid names
        if not package_name or package_name.startswith('_'):
            return
            
        # Check if it's a standard library module
        if package_name in self.stdlib_modules:
            return
            
        # Try to find if it's an internal module FIRST
        # This is important - internal modules take precedence over external packages
        internal_path = self._find_internal_module(module_name, from_file)
        if internal_path:
            self.internal_files.add(internal_path)
            self._analyze_file(internal_path)  # Recursively analyze
            # Don't add as external package if we found it internally
            return
            
        # Only consider as external package if not found internally
        # and it's actually installed
        if self._is_package_installed(package_name):
            self.external_packages.add(package_name)
            # Also get its dependencies
            self._add_package_dependencies(package_name)
                
    def _process_relative_import(self, from_file: Path, level: int, names: List) -> None:
        """Handle relative imports like 'from . import module'"""
        # Get the package directory
        current_dir = from_file.parent
        
        # Go up 'level-1' directories for the package
        for _ in range(level - 1):
            current_dir = current_dir.parent
            
        # Process each imported name
        for name_node in names:
            if hasattr(name_node, 'name'):
                module_file = current_dir / f"{name_node.name}.py"
                module_dir = current_dir / name_node.name / "__init__.py"
                
                if module_file.exists():
                    self.internal_files.add(module_file)
                    self._analyze_file(module_file)
                elif module_dir.exists():
                    self.internal_files.add(module_dir)
                    self._analyze_file(module_dir)
                    
    def _resolve_relative_import(self, module_name: str, from_file: Path, level: int) -> Optional[str]:
        """Resolve relative imports to absolute module names"""
        try:
            # Get the package path relative to project root
            rel_path = from_file.relative_to(self.project_root)
            parts = list(rel_path.parts[:-1])  # Remove the file name
            
            # Go up 'level' directories
            if level > len(parts):
                return None
                
            base_parts = parts[:-level] if level > 0 else parts
            
            if module_name:
                base_parts.extend(module_name.split('.'))
                
            return '.'.join(base_parts)
        except ValueError:
            return None
            
    def _find_internal_module(self, module_name: str, from_file: Path) -> Optional[Path]:
        """Find internal module file in the project"""
        # Convert module name to path components
        module_parts = module_name.split('.')
        
        # Search locations in order of preference
        search_dirs = [
            from_file.parent,  # Look relative to the importing file first
            self.project_root,
        ]
        
        # Also check parent directories up to project root
        current = from_file.parent
        while current != self.project_root.parent and current != current.parent:
            if current not in search_dirs:
                search_dirs.append(current)
            current = current.parent
        
        for base_dir in search_dirs:
            # Build the path progressively
            if len(module_parts) == 1:
                # Single module name
                paths_to_try = [
                    base_dir / f"{module_parts[0]}.py",
                    base_dir / module_parts[0] / "__init__.py",
                ]
            else:
                # Multi-part module name
                paths_to_try = [
                    base_dir / Path(*module_parts[:-1]) / f"{module_parts[-1]}.py",
                    base_dir / Path(*module_parts) / "__init__.py",
                ]
            
            for path in paths_to_try:
                if path.exists() and path.is_file():
                    # Make sure it's within the project
                    try:
                        path.relative_to(self.project_root)
                        return path.absolute()
                    except ValueError:
                        # Path is outside project root, skip it
                        continue
                
        return None
        
    def _is_package_installed(self, package_name: str) -> bool:
        """Check if a package is installed"""
        try:
            importlib.metadata.distribution(package_name)
            return True
        except importlib.metadata.PackageNotFoundError:
            # Try alternative names
            for alt_name in [package_name.replace('_', '-'), package_name.replace('-', '_')]:
                try:
                    importlib.metadata.distribution(alt_name)
                    return True
                except importlib.metadata.PackageNotFoundError:
                    continue
            return False
            
    def _add_package_dependencies(self, package_name: str, processed: Set[str] = None) -> None:
        """Add package dependencies recursively"""
        if processed is None:
            processed = set()
            
        if package_name in processed:
            return
            
        processed.add(package_name)
        
        try:
            dist = importlib.metadata.distribution(package_name)
            requires = dist.requires or []
            
            for req in requires:
                # Skip optional dependencies
                if '[' in req or 'extra ==' in req:
                    continue
                    
                # Extract package name from requirement spec
                dep_name = req.split(';')[0].split('[')[0].split('(')[0].split('<')[0].split('>')[0].split('=')[0].strip()
                
                if dep_name and self._is_package_installed(dep_name):
                    self.external_packages.add(dep_name)
                    self._add_package_dependencies(dep_name, processed)
                    
        except Exception:
            # Silently skip if we can't get dependencies
            pass

def main() -> None:
    """Main entry point for the script."""
    if len(sys.argv) != 2:
        print("Usage: python python-builder.py <entry_file>", file=sys.stderr)
        sys.exit(1)

    entry_file = sys.argv[1]
    
    try:
        # Get project root from environment or use parent directory
        project_root = os.environ.get('PROJECT_ROOT', os.path.dirname(os.path.dirname(entry_file)))
        
        # Analyze the file
        analyzer = PythonAnalyzer(entry_file, project_root)
        result = analyzer.analyze()
        
        # Send result back via IPC
        output = result.to_dict()
        bytes_message = (json.dumps(output) + '\n').encode('utf-8')
        os.write(NODEIPCFD, bytes_message)
        sys.exit(0)
        
    except Exception as e:
        import traceback
        print(f"Error: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(3)

if __name__ == "__main__":
    main()
