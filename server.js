const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Разрешаем запросы со всех источников

// Обслуживаем статические файлы из папки "public"
app.use(express.static(path.join(__dirname, 'public')));

// Подключаем puppeteer-core для работы с API
const puppeteer = require('puppeteer-core'); // Используем puppeteer-core, чтобы указать путь к установленному Chromium

async function fetchCurrencyRates() {
	// Настраиваем Puppeteer для использования Chromium
	const browser = await puppeteer.launch({
		executablePath: '/usr/bin/chromium', // Указываем путь к установленному Chromium
		headless: true, // Запуск в безголовом режиме
		args: [
			'--no-sandbox', // Убираем ограничения для работы в контейнере
			'--disable-setuid-sandbox', // Отключаем sandbox
			'--disable-dev-shm-usage', // Уменьшаем использование shared memory
			'--single-process' // Запускаем в одном процессе
		]
	});

	const page = await browser.newPage();

	// Переходим на страницу для получения курсов валют
	await page.goto('https://moneyshopphuket.com/contacts-ru', {
		waitUntil: 'domcontentloaded',
	});

	// Ждем загрузки данных
	await new Promise((resolve) => setTimeout(resolve, 1000));

	await browser.close();
	return data;
}

app.get('/rates', async (req, res) => {
	try {
		const data = await fetchCurrencyRates();
		res.json(data);
	} catch (error) {
		console.error('Ошибка получения данных:', error);
		res.status(500).send('Ошибка сервера');
	}
});

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html')); // Отправляем главную страницу
});

app.listen(port, () => {
	console.log(`Сервер запущен на http://localhost:${port}`);
});