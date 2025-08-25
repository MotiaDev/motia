import os
import sys
import traceback
from modulefinder import ModuleFinder
from typing import List


def trace_project_files(project_dir: str, entry_file: str) -> List[str]:
    """Trace the project files."""
    
    try:
        # Normalize paths
        project_dir = os.path.abspath(project_dir)
        entry_file = os.path.abspath(entry_file)
        
        # Create ModuleFinder with default path to find all imports
        finder = ModuleFinder(path=[project_dir])
        
        # Run the script to analyze imports
        finder.run_script(entry_file)
        
        # Collect all file paths from modules
        project_files = set()
        
        for module in finder.modules.values():
            if module is None or not hasattr(module, '__file__') or module.__file__ is None:
                continue

            # Get the absolute path of the module file
            module_path = os.path.abspath(module.__file__)
            
            # Only include files within the project directory
            if module_path.startswith(project_dir) and module_path != entry_file:
                relative_path = os.path.relpath(module_path, project_dir)
                project_files.add(relative_path)
        
        # Convert to list and sort for consistent output
        return sorted(list(project_files))
        
    except Exception as e:
        print(f"Error in find_project_files: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return []
