Step 1 : Create a file called dev.env at the project root (rocketvote/dev.env) and copy the contents of sample.env into it and save it
Step 2 : delete node_modules from the frontend directory if it exists
Step 3 : Start docker and then run : API_PORT=8080 docker compose up --build

You can see the react app at localhost (no need of port number) and the api at localhost:8080