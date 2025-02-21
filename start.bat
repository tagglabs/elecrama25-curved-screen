echo Starting development server...
start cmd /k "cd /d %cd% && npm run dev"

echo Starting backend server...
start cmd /k "cd /d %cd% && npm run server"

exit
