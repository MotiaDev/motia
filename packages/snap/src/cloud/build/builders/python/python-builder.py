#!/usr/bin/env python3
"""
Python Dependency Analyzer for Build System
Analyzes Python source files to detect dependencies for deployment packaging.
"""

import os
import sys
import json
import ast
import logging
import importlib.metadata
from pathlib import Path
from typing import Set, List, Dict, Optional, Tuple, Any
from dataclasses import dataclass, asdict, field
from enum import Enum
from functools import lru_cache

# Configure logging
logging.basicConfig(
    level=logging.WARNING,
    format='%(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)


class ModuleType(Enum):
    """Classification of module types"""
    STANDARD_LIBRARY = "stdlib"
    INTERNAL = "internal"
    EXTERNAL = "external"
    UNKNOWN = "unknown"


@dataclass
class PackageInfo:
    """Information about an external package"""
    name: str
    version: Optional[str] = None
    is_direct_import: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'version': self.version,
            'is_direct_import': self.is_direct_import
        }


@dataclass
class DependencyAnalysis:
    """Results of dependency analysis"""
    packages: List[PackageInfo] = field(default_factory=list)
    files: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'packages': [pkg.to_dict() for pkg in self.packages],
            'files': self.files
        }


class ImportVisitor(ast.NodeVisitor):
    """AST visitor to extract import statements"""
    
    def __init__(self):
        self.imports: List[Tuple[str, int]] = []
        
    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            self.imports.append((alias.name, 0))
        self.generic_visit(node)
        
    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        if node.module:
            self.imports.append((node.module, node.level))
        elif node.level > 0:
            # Relative import without module (e.g., "from . import x")
            self.imports.append(('', node.level))
        self.generic_visit(node)


class ModuleClassifier:
    """Classifies modules into categories"""
    
    def __init__(self):
        self._stdlib_modules = self._get_stdlib_modules()
        
    @lru_cache(maxsize=512)
    def classify(self, module_name: str) -> ModuleType:
        """Classify a module by its type"""
        if not module_name or module_name.startswith('_'):
            return ModuleType.UNKNOWN
            
        base_module = module_name.split('.')[0]
        
        if base_module in self._stdlib_modules:
            return ModuleType.STANDARD_LIBRARY
            
        return ModuleType.UNKNOWN  # Will be determined by context
        
    def _get_stdlib_modules(self) -> Set[str]:
        """Get set of standard library module names"""
        if hasattr(sys, 'stdlib_module_names'):
            return set(sys.stdlib_module_names)
            
        # Fallback for Python < 3.10
        import distutils.sysconfig as sysconfig
        stdlib = set(sys.builtin_module_names)
        
        try:
            std_lib_path = sysconfig.get_python_lib(standard_lib=True)
            for item in os.listdir(std_lib_path):
                if item.endswith('.py'):
                    stdlib.add(item[:-3])
                elif os.path.isdir(os.path.join(std_lib_path, item)) and not item.startswith('_'):
                    stdlib.add(item)
        except OSError:
            pass
            
        # Add commonly known stdlib modules
        stdlib.update({
            'asyncio', 'collections', 'concurrent', 'ctypes', 'datetime',
            'decimal', 'email', 'encodings', 'html', 'http', 'importlib',
            'json', 'logging', 'multiprocessing', 'pathlib', 'pickle',
            're', 'sqlite3', 'statistics', 'threading', 'typing', 'unittest',
            'urllib', 'xml', 'xmlrpc', 'zipfile', 'zoneinfo'
        })
        
        return stdlib


class InternalModuleFinder:
    """Finds internal project modules"""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root.absolute()
        
    def find_module_file(self, module_name: str, from_file: Path) -> Optional[Path]:
        """Find a module file within the project"""
        module_parts = module_name.split('.')
        
        # Search locations in priority order
        search_paths = self._get_search_paths(from_file)
        
        for base_dir in search_paths:
            module_path = self._check_module_variations(base_dir, module_parts)
            if module_path:
                return module_path
                
        return None
        
    def _get_search_paths(self, from_file: Path) -> List[Path]:
        """Get ordered search paths for module resolution"""
        paths = [
            from_file.parent,  # Same directory as importing file
            self.project_root,  # Project root
        ]
        
        # Add parent directories up to project root
        current = from_file.parent
        while current != self.project_root and current != current.parent:
            if current not in paths:
                paths.append(current)
            current = current.parent
            
        return paths
        
    def _check_module_variations(self, base_dir: Path, module_parts: List[str]) -> Optional[Path]:
        """Check different file variations for a module"""
        if len(module_parts) == 1:
            # Single module: check both file and package
            variations = [
                base_dir / f"{module_parts[0]}.py",
                base_dir / module_parts[0] / "__init__.py",
            ]
        else:
            # Multi-part module
            variations = [
                base_dir / Path(*module_parts[:-1]) / f"{module_parts[-1]}.py",
                base_dir / Path(*module_parts) / "__init__.py",
            ]
            
        for path in variations:
            if path.exists() and path.is_file():
                try:
                    # Ensure it's within the project
                    path.relative_to(self.project_root)
                    return path.absolute()
                except ValueError:
                    continue
                    
        return None


class ExternalPackageResolver:
    """Resolves external package information"""
    
    def __init__(self):
        self._package_cache: Dict[str, Optional[PackageInfo]] = {}
        
    @lru_cache(maxsize=256)
    def get_package_info(self, package_name: str) -> Optional[PackageInfo]:
        """Get information about an installed package"""
        if package_name in self._package_cache:
            return self._package_cache[package_name]
            
        # Try different naming variations
        for name_variant in self._get_name_variants(package_name):
            try:
                dist = importlib.metadata.distribution(name_variant)
                info = PackageInfo(
                    name=name_variant,
                    version=dist.version,
                    is_direct_import=True
                )
                self._package_cache[package_name] = info
                return info
            except importlib.metadata.PackageNotFoundError:
                continue
                
        self._package_cache[package_name] = None
        return None
        
    def get_package_dependencies(self, package_name: str) -> Set[str]:
        """Get dependencies of a package"""
        dependencies = set()
        
        try:
            dist = importlib.metadata.distribution(package_name)
            requires = dist.requires or []
            
            for req in requires:
                # Skip optional dependencies
                if '[' in req or 'extra ==' in req:
                    continue
                    
                # Extract package name
                dep_name = req.split(';')[0].split('[')[0].split('(')[0]
                dep_name = dep_name.split('<')[0].split('>')[0].split('=')[0].strip()
                
                if dep_name:
                    dependencies.add(dep_name)
                    
        except Exception:
            pass
            
        return dependencies
        
    def _get_name_variants(self, package_name: str) -> List[str]:
        """Generate possible package name variations"""
        variants = [
            package_name,
            package_name.replace('-', '_'),
            package_name.replace('_', '-'),
            package_name.lower(),
        ]
        
        # Handle special cases
        if package_name.lower() == 'pyjwt':
            variants.append('PyJWT')
        elif package_name.lower().startswith('python-'):
            variants.append(package_name[7:])
        elif package_name.lower().startswith('python_'):
            variants.append(package_name[7:])
            
        return variants


class PythonDependencyAnalyzer:
    """Main analyzer for Python dependencies"""
    
    def __init__(self, project_root: str, entry_file: str):
        self.project_root = Path(project_root).absolute()
        self.entry_file = Path(entry_file).absolute()
        
        # Initialize components
        self.classifier = ModuleClassifier()
        self.internal_finder = InternalModuleFinder(self.project_root)
        self.package_resolver = ExternalPackageResolver()
        
        # Track processed items
        self.analyzed_files: Set[Path] = set()
        self.internal_files: Set[Path] = set()
        self.external_packages: Dict[str, PackageInfo] = {}
        
    def analyze(self) -> DependencyAnalysis:
        """Analyze dependencies starting from entry file"""
        # Always include the entry file
        self.internal_files.add(self.entry_file)
        
        # Start recursive analysis
        self._analyze_file(self.entry_file, is_direct=True)
        
        # Process sub-dependencies of external packages
        self._process_package_dependencies()
        
        # Convert to output format
        return self._create_analysis_result()
        
    def _analyze_file(self, file_path: Path, is_direct: bool = False) -> None:
        """Recursively analyze a Python file"""
        if file_path in self.analyzed_files or not file_path.exists():
            return
            
        self.analyzed_files.add(file_path)
        
        try:
            # Parse the file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            tree = ast.parse(content, filename=str(file_path))
            
            # Extract imports
            visitor = ImportVisitor()
            visitor.visit(tree)
            
            # Process each import
            for module_name, level in visitor.imports:
                self._process_import(module_name, file_path, level, is_direct)
                
        except (SyntaxError, UnicodeDecodeError) as e:
            logger.warning(f"Could not parse {file_path}: {e}")
        except Exception as e:
            logger.warning(f"Error analyzing {file_path}: {e}")
            
    def _process_import(self, module_name: str, from_file: Path, level: int, is_direct: bool) -> None:
        """Process a single import statement"""
        # Handle relative imports
        if level > 0:
            module_name = self._resolve_relative_import(module_name, from_file, level)
            if not module_name:
                return
                
        # Skip invalid or private modules
        if not module_name or module_name.startswith('_'):
            return
            
        # Check module type
        module_type = self.classifier.classify(module_name)
        
        if module_type == ModuleType.STANDARD_LIBRARY:
            return
            
        # Try to find as internal module first
        internal_path = self.internal_finder.find_module_file(module_name, from_file)
        if internal_path:
            self.internal_files.add(internal_path)
            self._analyze_file(internal_path, is_direct=False)
            return
            
        # Must be external package
        base_package = module_name.split('.')[0]
        package_info = self.package_resolver.get_package_info(base_package)
        
        if package_info:
            if base_package not in self.external_packages:
                package_info.is_direct_import = is_direct
                self.external_packages[base_package] = package_info
                
    def _resolve_relative_import(self, module_name: str, from_file: Path, level: int) -> Optional[str]:
        """Resolve relative imports to absolute names"""
        try:
            rel_path = from_file.relative_to(self.project_root)
            parts = list(rel_path.parts[:-1])
            
            if level > len(parts):
                return None
                
            base_parts = parts[:-level] if level > 0 else parts
            
            if module_name:
                base_parts.extend(module_name.split('.'))
                
            return '.'.join(base_parts)
        except ValueError:
            return None
            
    def _process_package_dependencies(self) -> None:
        """Process sub-dependencies of external packages"""
        processed = set()
        to_process = list(self.external_packages.keys())
        
        while to_process:
            package_name = to_process.pop(0)
            if package_name in processed:
                continue
                
            processed.add(package_name)
            
            # Get dependencies
            dependencies = self.package_resolver.get_package_dependencies(package_name)
            
            for dep_name in dependencies:
                if dep_name not in self.external_packages:
                    dep_info = self.package_resolver.get_package_info(dep_name)
                    if dep_info:
                        dep_info.is_direct_import = False
                        self.external_packages[dep_name] = dep_info
                        to_process.append(dep_name)
                        
    def _create_analysis_result(self) -> DependencyAnalysis:
        """Create the final analysis result"""
        # Convert internal files to relative paths
        relative_files = []
        for file_path in self.internal_files:
            try:
                rel_path = file_path.relative_to(self.project_root)
                relative_files.append(str(rel_path))
            except ValueError:
                # File outside project root
                relative_files.append(str(file_path))
                
        return DependencyAnalysis(
            packages=list(self.external_packages.values()),
            files=sorted(relative_files)
        )


def main() -> None:
    """Main entry point"""
    # Parse arguments
    if len(sys.argv) != 3:
        print("Usage: python python-builder.py <project_dir> <entry_file>", file=sys.stderr)
        sys.exit(1)
        
    project_root = sys.argv[1]
    entry_file = sys.argv[2]
    
    # Get IPC file descriptor
    ipc_fd = int(os.environ.get("NODE_CHANNEL_FD", "0"))
    
    try:
        # Analyze dependencies
        analyzer = PythonDependencyAnalyzer(project_root, entry_file)
        result = analyzer.analyze()
        
        # Convert to JSON
        output = result.to_dict()
        
        # Send via IPC or stdout
        if ipc_fd > 0:
            # IPC needs compact JSON without formatting
            json_output = json.dumps(output)
            os.write(ipc_fd, (json_output + '\n').encode('utf-8'))
        else:
            # Pretty print for debugging
            json_output = json.dumps(output, indent=2)
            print(json_output)
            
        sys.exit(0)
        
    except Exception as e:
        import traceback
        
        # Create error response
        error_info = {
            'error': str(e),
            'type': type(e).__name__,
            'traceback': traceback.format_exc()
        }
        
        logger.error(f"Analysis failed: {json.dumps(error_info, indent=2)}")
        
        if ipc_fd > 0:
            error_output = json.dumps({'error': error_info})
            os.write(ipc_fd, (error_output + '\n').encode('utf-8'))
            
        sys.exit(3)


if __name__ == "__main__":
    main()