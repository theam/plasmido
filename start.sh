#!/usr/bin/env bash

export HOST_IP=$(ifconfig | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}" | grep -v 127.0.0.1 | awk '{ print $2 }' | cut -f2 -d: | head -n1) && \
docker-compose -f docker-compose_wurstmeister.yml  up --remove-orphans -d && \
docker-compose -f docker-compose_confluent_3.yml  up -d


