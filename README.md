# Конвертер валют

Веб-приложение для конвертации валют с актуальными курсами.

## Деплой на Netlify

### Предварительные требования

- Аккаунт на [Netlify](https://www.netlify.com/)
- Git репозиторий с проектом

### Шаги для деплоя

1. Войдите в свой аккаунт Netlify
2. Нажмите "New site from Git"
3. Выберите свой Git провайдер (GitHub, GitLab, Bitbucket)
4. Выберите репозиторий с проектом
5. Настройте параметры сборки:
   - Build command: `npm install`
   - Publish directory: `public`
6. Нажмите "Deploy site"

### Настройка переменных окружения

После деплоя необходимо настроить следующие переменные окружения в настройках сайта на Netlify:

1. Перейдите в раздел "Site settings" > "Build & deploy" > "Environment"
2. Добавьте следующие переменные:
   - `NODE_VERSION`: `18`

### Решение проблем

Если после деплоя возникают проблемы с получением данных о курсах валют:

1. **Ошибка 500 при запросе к `/rates`**:

   - Проверьте логи функций Netlify в разделе "Functions" на панели управления Netlify
   - Убедитесь, что функция имеет доступ к Chromium (настройка `included_files` в netlify.toml)
   - Попробуйте перезапустить сборку сайта

2. **Проблемы с Puppeteer**:

   - Приложение использует резервные данные о курсах валют, если не удается получить актуальные
   - Для отладки можно временно изменить резервные данные в файле `netlify/functions/rates.js`

3. **Ошибки JavaScript на клиенте**:

   - Очистите кэш браузера
   - Проверьте консоль разработчика на наличие ошибок
   - Убедитесь, что все файлы успешно загружаются

4. **Ошибка "Cannot read properties of undefined (reading 'replace')"**:
   - Эта ошибка возникает, когда формат данных о курсах валют не соответствует ожидаемому
   - В коде добавлена обработка различных форматов данных и защита от ошибок
   - Резервные данные теперь имеют формат, соответствующий реальным данным

### Особенности реализации

#### Кэширование данных

Для оптимизации производительности и уменьшения нагрузки на сервер реализовано кэширование данных о курсах валют:

- Серверное кэширование: данные о курсах валют кэшируются на сервере на 15 минут
- Клиентское кэширование: заголовок Cache-Control настроен на кэширование ответов на стороне клиента на 15 минут
- Обработка ошибок: при ошибке получения новых данных возвращаются данные из кэша (даже если они устарели)

#### Обработка ошибок

Реализована надежная обработка ошибок:

- При ошибке загрузки данных с сервера показывается соответствующее сообщение
- Автоматический повторный запрос данных через 30 секунд при ошибке
- Возврат кэшированных данных при недоступности источника данных
- Использование резервных данных, если кэш отсутствует
- Защита от ошибок при обработке данных различных форматов

### Локальная разработка

1. Клонируйте репозиторий
2. Установите зависимости: `npm install`
3. Запустите сервер: `npm start` или `npm run dev` для режима разработки
4. Откройте браузер по адресу: `http://localhost:3000`

## Структура проекта

- `public/` - статические файлы (HTML, CSS, JS, изображения)
- `netlify/functions/` - серверные функции для Netlify
- `netlify.toml` - конфигурация для Netlify
