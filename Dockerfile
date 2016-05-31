FROM node:4.2
RUN mkdir -p /opt/sinopia && mkdir -p /opt/sinopia/volume
WORKDIR /opt/sinopia
ADD package.json /opt/sinopia/
RUN npm install
ADD . /opt/sinopia
CMD ["/opt/sinopia/docker/start.sh"]
EXPOSE 4873
VOLUME /opt/sinopia/volume
