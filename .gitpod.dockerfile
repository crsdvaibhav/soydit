FROM gitpod/workspace-full
USER gitpod
RUN sudo apt-get update && sudo apt-get install -y redis-server && sudo rm -rf /var/lib/apt/lists/*