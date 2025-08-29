#!/usr/bin/env python3
"""
Dynamic Package-to-Module Resolver
Uses importlib.metadata to dynamically resolve package names to their importable modules.
"""

import os
import sys
import json
import importlib.metadata
from typing import Dict, List, Optional, Set
from pathlib import Path
from functools import lru_cache


class PackageModuleResolver:
    """Resolves package distribution names to their importable module names"""
    
    def __init__(self):
        self._cache: Dict[str, List[str]] = {}
        self._reverse_cache: Dict[str, str] = {}  # module -> package mapping
        self._build_reverse_cache()
    
    def _build_reverse_cache(self):
        """Build a reverse mapping of module names to package names"""
        try:
            for dist in importlib.metadata.distributions():
                try:
                    # Get top-level modules for this distribution
                    if dist.files:
                        top_level = self._get_top_level_modules(dist.name)
                        for module in top_level:
                            self._reverse_cache[module] = dist.name
                except Exception:
                    continue
        except Exception:
            pass
    
    @lru_cache(maxsize=256)
    def _get_top_level_modules(self, package_name: str) -> List[str]:
        """Get top-level modules provided by a package"""
        try:
            dist = importlib.metadata.distribution(package_name)
            
            # Method 1: Check for top_level.txt in metadata
            if dist.files:
                for file in dist.files:
                    if file.name == 'top_level.txt':
                        content = file.read_text()
                        if content:
                            return [m.strip() for m in content.strip().split('\n') if m.strip()]
            
            # Method 2: Check the 'top_level' metadata (newer packages)
            if hasattr(dist, 'read_text'):
                try:
                    top_level_txt = dist.read_text('top_level.txt')
                    if top_level_txt:
                        return [m.strip() for m in top_level_txt.strip().split('\n') if m.strip()]
                except Exception:
                    pass
            
            # Method 3: Infer from files
            modules = set()
            if dist.files:
                for file in dist.files:
                    # Look for .py files or package directories
                    path = Path(str(file))
                    if path.suffix == '.py':
                        # Get the module name from the file
                        if path.stem != '__init__':
                            modules.add(path.stem)
                    elif '/' in str(file):
                        # Get the top-level package name
                        parts = str(file).split('/')
                        if parts[0] and not parts[0].endswith('.dist-info') and not parts[0].endswith('.egg-info'):
                            modules.add(parts[0])
            
            if modules:
                return sorted(list(modules))
            
        except importlib.metadata.PackageNotFoundError:
            pass
        except Exception:
            pass
        
        # Fallback: Return empty list
        return []
    
    def get_module_names(self, package_name: str) -> List[str]:
        """Get the importable module names for a package"""
        if package_name in self._cache:
            return self._cache[package_name]
        
        # Try exact name first
        modules = self._get_top_level_modules(package_name)
        
        # Try variations if exact name didn't work
        if not modules:
            variations = [
                package_name.replace('-', '_'),
                package_name.replace('_', '-'),
                package_name.lower(),
                package_name.upper(),
            ]
            
            for variant in variations:
                modules = self._get_top_level_modules(variant)
                if modules:
                    break
        
        # If still no modules found, use heuristics
        if not modules:
            modules = self._heuristic_module_names(package_name)
        
        self._cache[package_name] = modules
        return modules
    
    def _heuristic_module_names(self, package_name: str) -> List[str]:
        """Use heuristics to guess module names"""
        guesses = []
        
        # Common transformations
        base_name = package_name.lower()
        
        # Remove common prefixes
        if base_name.startswith('python-'):
            base_name = base_name[7:]
        elif base_name.startswith('py'):
            # Special case: PyJWT -> jwt
            possible = base_name[2:].lower()
            if possible:
                guesses.append(possible)
        
        # Standard transformations
        guesses.extend([
            base_name,
            base_name.replace('-', '_'),
            base_name.replace('_', '-'),
            package_name.replace('-', '_'),
        ])
        
        # Remove duplicates while preserving order
        seen = set()
        result = []
        for guess in guesses:
            if guess and guess not in seen:
                seen.add(guess)
                result.append(guess)
        
        return result
    
    def find_package_for_module(self, module_name: str) -> Optional[str]:
        """Find the package that provides a given module"""
        # Check cache first
        if module_name in self._reverse_cache:
            return self._reverse_cache[module_name]
        
        # Check top-level module name
        base_module = module_name.split('.')[0]
        if base_module in self._reverse_cache:
            return self._reverse_cache[base_module]
        
        # Try to find by checking all distributions
        for dist in importlib.metadata.distributions():
            try:
                modules = self._get_top_level_modules(dist.name)
                if base_module in modules:
                    self._reverse_cache[base_module] = dist.name
                    return dist.name
            except Exception:
                continue
        
        return None
    
    def generate_package_map(self, packages: List[str]) -> Dict[str, List[str]]:
        """Generate a complete package-to-modules mapping for given packages"""
        mapping = {}
        for package in packages:
            modules = self.get_module_names(package)
            if modules:
                mapping[package] = modules
        return mapping


def main():
    """Command-line interface for testing"""
    if len(sys.argv) < 2:
        print("Usage: python package-resolver.py <package_name> [<package_name> ...]")
        print("   or: python package-resolver.py --find-module <module_name>")
        print("   or: python package-resolver.py --generate-map <package1> <package2> ...")
        sys.exit(1)
    
    resolver = PackageModuleResolver()
    
    if sys.argv[1] == '--find-module' and len(sys.argv) > 2:
        # Find package for a module
        module_name = sys.argv[2]
        package = resolver.find_package_for_module(module_name)
        result = {
            'module': module_name,
            'package': package
        }
        print(json.dumps(result, indent=2))
    
    elif sys.argv[1] == '--generate-map':
        # Generate complete mapping
        packages = sys.argv[2:] if len(sys.argv) > 2 else []
        mapping = resolver.generate_package_map(packages)
        print(json.dumps(mapping, indent=2))
    
    else:
        # Get modules for packages
        results = {}
        for package_name in sys.argv[1:]:
            modules = resolver.get_module_names(package_name)
            results[package_name] = modules
        
        print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()