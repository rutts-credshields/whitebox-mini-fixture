FROM node:18-bullseye

WORKDIR /srv/app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p /srv/app/tmp && chmod -R 777 /srv/app/tmp
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "start"]
