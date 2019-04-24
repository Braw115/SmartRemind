FROM node
MAINTAINER Ye Jinshou <329365307@qq.com>
RUN mkdir -p /opt/todo-srv/logs/
ADD build /opt/todo-srv/build
ADD node_modules /opt/todo-srv/node_modules
ADD public /opt/todo-srv/public
ADD package.json /opt/todo-srv/package.json
ADD docker-entrypoint.sh /opt/
RUN chmod +x /opt/docker-entrypoint.sh
WORKDIR  /opt/todo-srv/
EXPOSE 3000
ENTRYPOINT /opt/docker-entrypoint.sh
