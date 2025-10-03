#!/bin/bash

# Fix Next.js 15 route params - convert params object to Promise

echo "Fixing route params for Next.js 15..."

# Find all route files with dynamic segments
files=$(find src/app/api -name "route.ts" -path "*/[*]/*")

for file in $files; do
  echo "Processing: $file"
  
  # Skip if already uses Promise
  if grep -q "params: Promise<{" "$file"; then
    echo "  ✓ Already fixed"
    continue
  fi
  
  # Check if file has RouteParams interface
  if grep -q "interface RouteParams" "$file"; then
    # Update the interface
    sed -i.bak 's/params: {$/params: Promise<{/' "$file"
    sed -i.bak 's/  };$/  }>;/' "$file"
    
    # Update const { id } = params to await
    sed -i.bak 's/const { id } = params;/const { id } = await params;/' "$file"
    
    # Also handle other destructured params
    sed -i.bak 's/const params = /const resolvedParams = await /' "$file"
    sed -i.bak 's/const { /const { /g' "$file"
    
    # Remove backup files
    rm -f "$file.bak"
    
    echo "  ✓ Fixed"
  else
    echo "  - No RouteParams interface found"
  fi
done

echo "Done!"
