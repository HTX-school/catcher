FROM node:16.10.0
ENV NODE_ENV=production
ENV HOSTNAME=localhost
ENV PORT=5000

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

EXPOSE ${PORT}

CMD [ "npm", "start"]
