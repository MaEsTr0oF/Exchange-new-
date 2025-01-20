document.addEventListener('DOMContentLoaded', async () => {
	const amountInput = document.getElementById('amount');
	const fromCurrencySelect = document.getElementById('fromCurrency');
	const toCurrencySelect = document.getElementById('toCurrency');
	const convertedAmountSpan = document.getElementById('convertedAmount');
	const allowedCurrencies = ['RUB', 'USD', 'EUR', 'GBP', 'AUD', 'CNY', 'THB'];

	const startMoneyTake = document.getElementById('startmoneytake');
	const endMoneyTake = document.getElementById('endmoneytake');
	const startMoneyGet = document.getElementById('startmoneyget');
	const endMoneyGet = document.getElementById('endmoneyget');

	const flagTake = document.getElementById('flagtake');
	const flagGet = document.getElementById('flagget');

	async function fetchCurrencyRates() {
		try {
			const response = await fetch('https://exchange-production-e6a6.up.railway.app/rates');  // Используем публичный URL
			if (!response.ok) throw new Error('Ошибка загрузки данных');
			return await response.json();
		} catch (error) {
			console.error('Ошибка при получении курсов:', error);
		}
	}
	async function convertCurrency(data, fromCurrency, toCurrency) {
		const amount = parseFloat(amountInput.value);

		// Проверяем, выбраны ли валюты
		if (!fromCurrency || !toCurrency) {
			convertedAmountSpan.textContent = "Выберите валюты для конвертации.";
			return;
		}

		// Проверяем корректность введённой суммы
		if (isNaN(amount) || amount <= 0) {
			convertedAmountSpan.textContent = "  ";
			return;
		}

		let convertedAmount = 0;

		try {
			if (data) {
				if (fromCurrency === 'THB' && toCurrency === 'THB') {
					convertedAmount = amount;
				}
				else if (fromCurrency === 'THB') {
					// Конвертация из THB в другую валюту
					const toRate = parseFloat(data[toCurrency][0].split(' ')[0]); // Курс TO валюты в THB
					convertedAmount = amount / toRate; // Инвертируем курс
				} else if (toCurrency === 'THB') {
					// Конвертация из другой валюты в THB
					const fromRate = parseFloat(data[fromCurrency][0].split(' ')[0]); // Курс FROM валюты в THB
					convertedAmount = amount * fromRate; // Прямой расчет
				} else {
					// Конвертация между двумя валютами (не THB)
					const fromRate = parseFloat(data[fromCurrency][0].split(' ')[0]); // Курс FROM валюты в THB
					const toRate = parseFloat(data[toCurrency][0].split(' ')[0]); // Курс TO валюты в THB
					convertedAmount = amount * (toRate / fromRate);
				}
			}

			// Отображаем результат
			convertedAmountSpan.textContent = convertedAmount.toFixed(2);

			// Обновляем дополнительные элементы (например, курсы валют)
			updateExchangeRateSpans(data, fromCurrency, toCurrency);
		} catch (error) {
			console.error('Ошибка при конвертации валют', error);
			convertedAmountSpan.textContent = "Ошибка при конвертации.";
		}
	}
	const data = await fetchCurrencyRates();
	if (data) {

	}

	const burger = document.querySelector('.burger');
	const burgerMenu = document.querySelector('.burger_menu');
	const navigation = document.querySelector('.menu_navigation');
	const overlay = document.createElement('div');
	const header = document.querySelector('.header');
	overlay.className = 'overlay';
	document.body.appendChild(overlay);

	const items = {
		1400: document.querySelector('.navigation_curse'),
		1100: document.querySelector('.navigation_uslug'),
		1000: document.querySelector('.navigation_information'),
		950: document.querySelector('.information_phone'),
		900: document.querySelector('.information_btn'),
	};

	const toggleMenu = () => {
		burger.classList.toggle('open');
		burgerMenu.classList.toggle('open');
		overlay.classList.toggle('active');
		header.classList.toggle('active');
	};

	burger.addEventListener('click', toggleMenu);
	overlay.addEventListener('click', (event) => {
		if (event.target === overlay) toggleMenu();
	});

	const moveToBurger = () => {
		const width = window.innerWidth;

		for (const breakpoint in items) {
			const item = items[breakpoint];
			if (width <= breakpoint) {
				if (item && !burgerMenu.contains(item)) burgerMenu.appendChild(item);
			} else {
				if (item && !navigation.contains(item)) navigation.appendChild(item);
			}
		}
	};

	window.addEventListener('resize', moveToBurger);
	moveToBurger();
});
