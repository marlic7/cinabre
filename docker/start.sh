#!/bin/bash
if [ ! -f /opt/cinabre/volume/config.yaml ]; then
  cp /opt/cinabre/conf/docker.yaml /opt/cinabre/volume/config.yaml
fi
cat /opt/cinabre/volume/config.yaml
node /opt/cinabre/bin/cinabre --config /opt/cinabre/volume/config.yaml
