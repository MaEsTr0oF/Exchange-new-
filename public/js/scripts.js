document.addEventListener('DOMContentLoaded', async () => {
	const amountInput = document.getElementById('amount');
	const amountInput1 = document.getElementById('amount1');
	const currencySelect = document.getElementById('toCurrency');
	const resultSpan = document.getElementById('result');
	const startVal = document.getElementById('start-val');
	const finalVal      = document.getElementById('final-val');
	const excVal        = document.getElementById('exc-val');
	const burger = document.querySelector('.burger');
	const burgerMenu = document.querySelector('.burger_menu');
	const navigation = document.querySelector('.header_menu');
	const header = document.querySelector('.header');

	const items = {
		905: document.querySelector('.header_calc'),
		904: document.querySelector('.header_adv'),
		903: document.querySelector('.header_more'),
		902: document.querySelector('.header_com'),
		901: document.querySelector('.header_con'),
	};

	const toggleMenu = () => {
		burger.classList.toggle('open');
		burgerMenu.classList.toggle('open');
	};

	burger.addEventListener('click', toggleMenu);
	let data = await fetchCurrencyRates();
	console.log(data);
	while(data==undefined){
		data = await fetchCurrencyRates();
		console.log("Не работает");
	}
	const moveToBurger = () => {
		const width = window.innerWidth;
		const image = document.querySelector(".background");
		for (const breakpoint in items) {
			const item = items[breakpoint];
			if (width <= breakpoint) {
				if (item && !burgerMenu.contains(item)) burgerMenu.appendChild(item);
			} else {
				if (item && !navigation.contains(item)) navigation.appendChild(item);
			}
		}
		if (width <= 1100) {
			image.src = "../img/getting/ATM2.png";
		}
	};

	window.addEventListener('resize', moveToBurger);
	moveToBurger();
 	//==============================================================================================================================
	function getRate() {
		try {
			switch (currencySelect.value) {
				case 'first':
					if (data.RUB[0].includes(" ")) {
						const splitted = data.RUB[0].split(" ");        // ["0.314", "(3.182)"]
						const withoutParentheses = splitted[1].replace(/[()]/g, "");  // "3.182"
						return parseFloat(withoutParentheses);
					} else {
						return parseFloat(data.RUB[0]);
					}
				case 'second':
					if (data.USD5[0].includes(" ")) {
						return parseFloat(data.USD5[0].split(" ")[0]);
					} else {
						return parseFloat(data.USD5[0]);
					}
				default:
					return 3.23; // Резервное значение
			}
		} catch (error) {
			console.warn("Ошибка при получении курса:", error);
			return 3.23; // Резервное значение в случае ошибки
		}
	}
	function updateLabelsAndRate() {
		switch (currencySelect.value) {
			case 'first':
				startVal.textContent = "RUB";
				break;
			case 'second':
				startVal.textContent = "USDT";
				
				break;
			case 'third':
				startVal.textContent = "EUR";
				break;
		}
	}
	function convertLeftToRight() {
		const rate = getRate();  // бат за 1 руб.
		const fromValue = parseFloat(amountInput.value) || 0;
	
		// 25k руб в батах:
		let rub25kInTHB;
		try {
			if (data.RUB[0].includes(" ")) {
				rub25kInTHB = 25000 * parseFloat(data.RUB[0].split(" ")[1].replace(/[()]/g, ""));
			} else {
				rub25kInTHB = 25000 * parseFloat(data.RUB[0]);
			}
		} catch (error) {
			console.warn("Ошибка при расчете rub25kInTHB:", error);
			rub25kInTHB = 25000 * 3.23; // Используем резервное значение
		}
		
		let koaf;
		// Если пользователь ввёл > 25k руб (в батах) -> 1
		if ((fromValue * rate) >= rub25kInTHB) {
			koaf = 1;
		} else {
			koaf = 1 + (1 - ((fromValue * rate) / rub25kInTHB)) / 30;
		}
		if(startVal.textContent == "RUB"){
			amountInput1.value = (fromValue / (rate * koaf)).toFixed(2);
			excVal.textContent = (rate * koaf).toFixed(2);
		}else{
			amountInput1.value = (fromValue * rate).toFixed(2);
			excVal.textContent = (rate).toFixed(2);
		}
	}
	
	function convertRightToLeft() {
		const rate = getRate();
		const toValue = parseFloat(amountInput1.value) || 0; // это бат
	
		// 25k руб в батах:
		let rub25kInTHB;
		try {
			if (data.RUB[0].includes(" ")) {
				rub25kInTHB = 25000 * parseFloat(data.RUB[0].split(" ")[1].replace(/[()]/g, ""));
			} else {
				rub25kInTHB = 25000 * parseFloat(data.RUB[0]);
			}
		} catch (error) {
			console.warn("Ошибка при расчете rub25kInTHB в convertRightToLeft:", error);
			rub25kInTHB = 25000 * 3.23; // Используем резервное значение
		}
	
		let koaf;
		if (toValue >= rub25kInTHB) {
			koaf = 1;
		} else {
			koaf = 1 + (1 - (toValue / rub25kInTHB)) / 30;
		}
		if(startVal.textContent == "RUB"){
			amountInput.value = ((toValue * rate * koaf)).toFixed(2);
		}else{
			amountInput.value = (toValue / rate).toFixed(2);
		}
	}
	updateLabelsAndRate();
	currencySelect.addEventListener('change', () => {
		
		updateLabelsAndRate();
		
		convertLeftToRight();
	});
	amountInput.addEventListener('input', () => {
		convertLeftToRight();
	});
	amountInput1.addEventListener('input', () => {
		convertRightToLeft();
	});
	async function fetchCurrencyRates() {
		try {
			// Показываем индикатор загрузки
			document.querySelectorAll('.currency-rate').forEach(el => {
				el.textContent = 'Загрузка...';
			});
			
			// Используем относительный путь для локальной разработки и продакшена
			const response = await fetch('/rates');
			if (!response.ok) throw new Error('Ошибка загрузки данных');
			return await response.json();
		} catch (error) {
			console.error('Ошибка при получении курсов:', error);
			// Показываем сообщение об ошибке
			document.querySelectorAll('.currency-rate').forEach(el => {
				el.textContent = 'Ошибка загрузки';
			});
			
			// Пробуем повторить запрос через 30 секунд
			setTimeout(() => {
				fetchCurrencyRates().then(newData => {
					if (newData) {
						data = newData;
						fillSpan();
						updateLabelsAndRate();
					}
				});
			}, 30000);
			
			// Возвращаем резервные данные, чтобы сайт мог работать
			return {
				"SBP": ["0.314 (3.18)", "0.314 (3.18)"],
				"RUB": ["0.314 (3.18)", "0.314 (3.18)"],
				"USD20": ["0.314 (3.18)", "0.314 (3.18)"],
				"USD5": ["0.314 (3.18)", "0.314 (3.18)"],
				"USD2": ["0.314 (3.18)", "0.314 (3.18)"],
				"EUR": ["0.314 (3.18)", "0.314 (3.18)"],
				"EUR1": ["0.314 (3.18)", "0.314 (3.18)"]
			};
		}
	}
	// Функция для обновления значений покупки и продажи
	async function fillSpan() {
		let i=0;
		for (const currency in data) {
			const buyingElement = document.querySelector(`.buying-${currency}`);
			const sellingElement = document.querySelector(`.selling-${currency}`);
			if (buyingElement) {
				try {
					if(i<2 && data[currency][0].includes(" ")){
						buyingElement.textContent = data[currency][0].split(" ")[1].replace(/[()]/g, "");
					} else {
						buyingElement.textContent = data[currency][0];
					}
				} catch (error) {
					console.warn(`Ошибка при обработке данных покупки для ${currency}:`, error);
					buyingElement.textContent = data[currency][0] || "3.23";
				}
			} else {
				console.warn(`Элемент покупки не найден для ${currency}`);
			}
			if (sellingElement) {
				try {
					if(i<2 && data[currency][1].includes(" ")){
						sellingElement.textContent = data[currency][1].split(" ")[1].replace(/[()]/g, "");
					} else {
						sellingElement.textContent = data[currency][1];
					}
				} catch (error) {
					console.warn(`Ошибка при обработке данных продажи для ${currency}:`, error);
					sellingElement.textContent = data[currency][1] || "3.23";
				}
			} else {
				console.warn(`Элемент продажи не найден для ${currency}`);
			}
		}
	}
});