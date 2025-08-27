# Базовый образ Node.js
FROM node:20-alpine

# Рабочая директория
WORKDIR /app

# Установим зависимости
COPY package*.json ./

RUN npm install --production

# Скопируем проект
COPY . .

# Prisma migrate для миграции базы данных
RUN npx prisma migrate dev 

# Запуск бота
CMD npm run dev
