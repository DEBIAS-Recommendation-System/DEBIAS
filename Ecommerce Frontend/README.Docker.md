### Building and running your application

When you're ready, start your application by running:
`docker build --platform linux/amd64 -t rayenmabrouk/softyhr-server:linux-{{your-version}} .`.

Your application will be available at http://localhost:3000.

### Deploying your application to the cloud

`docker push rayenmabrouk/softyhr-server:linux-{{your-version}}`

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References
* [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)