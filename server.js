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
const valFLAG = ['SBP', 'RUB', 'USD20', 'USD5', 'USD2', 'EUR', 'EUR1'];
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
	await new Promise((resolve) => setTimeout(resolve, 3000));

		const data = await page.evaluate((valFLAG) => {
			const result = {};
			const tempData = {}; // Временный объект для хранения данных перед сдвигом
			let usd20Skipped = false; // Флаг для пропуска первой записи USD20
			let eurIndex = -1; // Индекс валюты EUR

			const sections = document.querySelectorAll('.elementor-section-boxed.table-price__box');

			sections.forEach((section, index) => {
				let currency = valFLAG[index];

				// Пропускаем первую встречу USD20
				if (currency === 'USD20' && !usd20Skipped) {
					usd20Skipped = true;
					return; // Пропустить первую запись USD20
				}

				// Запоминаем индекс EUR для последующего сдвига
				if (currency === 'EUR') {
					eurIndex = index;
				}

				// Извлекаем значения покупки и продажи
				const values = Array.from(section.querySelectorAll('.table-price__value')).map((valueElement) => {
					return valueElement.textContent.trim();
				});

				if (values.length >= 2) {
					tempData[currency] = [values[0], values[1]];
				} else {
					tempData[currency] = [values[0] || 'N/A', values[1] || 'N/A'];
				}
			});

			// Перенос данных с учетом пропуска первой USD20 и сдвига EUR
			valFLAG.forEach((currency, index) => {
				if (currency === 'USD20' && tempData['USD5']) {
					result['USD20'] = tempData['USD5'];
				} else if (currency === 'USD5' && tempData['USD2']) {
					result['USD5'] = tempData['USD2'];
				} else if (currency === 'USD2' && tempData['EUR']) {
					result['USD2'] = tempData['EUR'];
				} else if (currency === 'EUR' && eurIndex !== -1 && valFLAG[eurIndex + 1]) {
					// Сдвигаем данные EUR на следующий элемент
					const nextCurrency = valFLAG[eurIndex + 1];
					result['EUR'] = tempData[nextCurrency] || ['N/A', 'N/A'];
				} else {
					result[currency] = tempData[currency] || ['N/A', 'N/A'];
				}
			});

			return result;
		}, valFLAG).catch(error => {
			console.error("Ошибка при извлечении данных с страницы:", error);
			throw error;
		});

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

