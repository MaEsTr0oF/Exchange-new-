// server.js

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

// Получаем __dirname в ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const valFLAG = ['SBP', 'RUB', 'USD20', 'USD5', 'USD2', 'EUR', 'EUR1'];
app.use(cors()); // Разрешаем запросы со всех источников

// Обслуживаем статические файлы из папки "public"
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Функция для ожидания заданного времени
 * @param {number} ms - количество миллисекунд для ожидания
 * @returns {Promise} - обещание, которое выполняется через ms миллисекунд
 */
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Функция для получения курсов валют с помощью Puppeteer.
 */
async function fetchCurrencyRates() {
	console.log("Запуск fetchCurrencyRates");

	// Настройки запуска Puppeteer
	const launchOptions = {
		headless: true, // Безголовый режим
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			'--single-process'
		]
	};

	try {
		console.log("Запуск браузера");
		const browser = await puppeteer.launch(launchOptions);
		const page = await browser.newPage();
		console.log("Переходим на страницу");
		await page.goto('https://moneyshopphuket.com/contacts-ru', {
			waitUntil: 'domcontentloaded',
		}).catch(error => {
			console.error("Ошибка при переходе на страницу:", error);
			throw error;
		});

		console.log("Ждём появления нужных элементов");
		await page.waitForSelector('.elementor-section-boxed.table-price__box', { timeout: 10000 }).catch(error => {
			console.error("Ошибка при ожидании селектора:", error);
			throw error;
		});

		console.log("Ждём 1 секунду для дополнительной загрузки данных");
		await sleep(1000); // Ждём 1 секунду

		console.log("Извлекаем данные");

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
		console.log("Данные получены:", data);
		return data;
	} catch (error) {
		console.error("Ошибка при получении курсов валют:", error);
		throw error;
	}
}

// API для получения курсов валют
app.get('/rates', async (req, res) => {
	try {
		const data = await fetchCurrencyRates();
		res.json(data);
	} catch (error) {
		console.error('Ошибка получения данных:', error);
		res.status(500).send('Ошибка сервера');
	}
});

// Обработка главной страницы
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html')); // Отправляем главную страницу
});

// Запуск сервера
app.listen(port, () => {
	console.log(`Сервер запущен на http://localhost:${port}`);
});
