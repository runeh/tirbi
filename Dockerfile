
FROM node:16-alpine

RUN mkdir /var/tirbi

COPY ./ /var/tirbi

WORKDIR /var/tirbi

RUN yarn
RUN yarn build
RUN yarn install --production

ENV NODE_ENV=production
CMD ["yarn", "start"]


