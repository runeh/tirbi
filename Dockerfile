FROM node:16-alpine3.14


RUN mkdir /app


COPY ./ /app/

RUN ls /app/


WORKDIR /app

RUN yarn

RUN yarn build

ENTRYPOINT [ "node", "./dist/cli.js" ]
