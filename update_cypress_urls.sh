#!/bin/bash
find ./cypress -type f -name "*.js" -exec sed -i 's/http:\/\/localhost:3000/http:\/\/0.0.0.0:3000/g' {} \;
echo "Updated all localhost:3000 references to 0.0.0.0:3000"