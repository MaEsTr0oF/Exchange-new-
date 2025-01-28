
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
	const data = await fetchCurrencyRates();
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
		switch (currencySelect.value) {
			case 'first':
				const splitted = data.RUB[0].split(" ");        // ["0.314", "(3.182)"]
      const withoutParentheses = splitted[1].replace(/[()]/g, "");  // "3.182"
      return parseFloat(withoutParentheses);  
			case 'second':
				return parseFloat(data.USD5[0].split(" ")[0]);
			default:
				return 0;
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
		const rub25kInTHB = 25000 * parseFloat(data.RUB[0].split(" ")[1].replace(/[()]/g, ""));
		
		let koaf;
		// Если пользователь ввёл > 25k руб (в батах) -> 1
		if ((fromValue * rate) >= rub25kInTHB) {
			koaf = 1;
		} else {
			koaf = 1 + (1 - ((fromValue * rate) / rub25kInTHB)) / 2;
		}
		if(startVal.textContent == "RUB"){
			amountInput1.value = (fromValue * rate * koaf).toFixed(2);
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
		const rub25kInTHB = 25000 * parseFloat(data.RUB[0].split(" ")[1].replace(/[()]/g, ""));
	
		let koaf;
		if (toValue >= rub25kInTHB) {
			koaf = 1;
		} else {
			koaf = 1 + (1 - (toValue / rub25kInTHB)) / 2;
		}
		if(startVal.textContent == "RUB"){
			amountInput.value = ((toValue / rate) * koaf).toFixed(2);
	
		excVal.textContent = (rate * koaf).toFixed(2);
		}else{
			amountInput.value = (toValue / rate).toFixed(2);
	
		excVal.textContent = (rate).toFixed(2);
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
			const response = await fetch('https://exchange-new-production.up.railway.app/rates');  // Используем публичный URL
			if (!response.ok) throw new Error('Ошибка загрузки данных');
			return await response.json();
		} catch (error) {
			console.error('Ошибка при получении курсов:', error);
		}
	}
	// Функция для обновления значений покупки и продажи
	async function fillSpan() {
		for (const currency in data) {
			const buyingElement = document.querySelector(`.buying-${currency}`);
			const sellingElement = document.querySelector(`.selling-${currency}`);
			if (buyingElement) {
				buyingElement.textContent = data[currency][0];
			} else {
				console.warn(`Элемент покупки не найден для ${currency}`);
			}
			if (sellingElement) {
				sellingElement.textContent = data[currency][1];
			} else {
				console.warn(`Элемент продажи не найден для ${currency}`);
			}
		}
	}
	fillSpan();
	//==============================================================================================================
	
	function rearrangeCountries() {
		// Получаем все элементы стран
		const container = document.querySelector(".countries_container");
		const rows = Array.from(container.querySelectorAll(".contries_row"));

		// Собираем все элементы в один массив
		let allCountries = [];
		rows.forEach(row => {
			allCountries.push(...row.children);
		});

		// Очищаем контейнер
		container.innerHTML = "";

		let count = 0; // Счетчик элементов
		let itemsPerRow;
		let newRow;

		for (let i = 0; i < allCountries.length; i++) {
			// Определение количества элементов в строке
			if (count < 20) {
				itemsPerRow = 4;  // Первые 5 строк по 4 элемента
			} else if (count === 20) {
				itemsPerRow = 5;  // 6-я строка с 5 элементами
			} else {
				itemsPerRow = 4;  // Все последующие строки по 4 элемента
			}

			// Создание новой строки, если достигнуто количество элементов в строке
			if (count % itemsPerRow === 0 || count === 0) {
				newRow = document.createElement("div");
				newRow.classList.add("contries_row");
				container.appendChild(newRow);
			}

			newRow.appendChild(allCountries[i]);
			count++;
		}
		const allRows = document.querySelectorAll(".contries_row");
		const lastRow = allRows[allRows.length - 1];
		const secondLastRow = allRows[allRows.length - 2];
		const thirdRow = allRows[allRows.length - 3];
		while (lastRow.children.length < 4 && secondLastRow && secondLastRow.children.length > 4) {
			lastRow.prepend(secondLastRow.lastElementChild);
		}
		if (lastRow.children.length === 1 && allRows.length > 1) {
			let prevRow = allRows[allRows.length - 2];
			while (lastRow.children.length < 4 && prevRow.children.length > 0) {
				lastRow.prepend(prevRow.lastElementChild);
			}
		}
			moveCountryItem(7, 5);
	}
	function moveCountryItem(fromRowIndex, toRowIndex) {
		// Получаем все строки
		const rows = document.querySelectorAll('.contries_row');

		// Проверяем, что строки существуют и индексы допустимы
		if (rows.length > fromRowIndex && rows.length > toRowIndex) {
			let fromRow = rows[fromRowIndex];  // Исходная строка
			let toRow = rows[toRowIndex];      // Целевая строка

			// Проверяем, есть ли элементы в исходной строке
			if (fromRow.children.length > 0) {
				// Перемещение последнего элемента из одной строки в другую
				toRow.appendChild(fromRow.lastElementChild);
			}
		}
	}
	// Запускаем перераспределение при изменении ширины экрана
	window.addEventListener("resize", function () {
		if (window.innerWidth <= 950) {
			rearrangeCountries();
		}
	});
	if (window.innerWidth <= 950) {
		rearrangeCountries();
	}
	document.querySelectorAll('.FAQ_card .card_title').forEach(title => {
		title.addEventListener('click', function () {
			const card = this.parentElement;
			const image =card.querySelector(".toggle_button");
			if(image.src.split("/")[5]=="button.png"){
				image.src="./img/button2.png";
			}else{
				image.src="./img/button.png";
			}
				
			card.classList.toggle('active');
		});
	});
});


