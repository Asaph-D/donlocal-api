# Étape 1 : Build
FROM node:20 AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .

# Étape 2 : Exécution
FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=build /usr/src/app .
EXPOSE 5000
CMD ["npm", "start"]