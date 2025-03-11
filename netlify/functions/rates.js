const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const valFLAG = ['SBP', 'RUB', 'USD20', 'USD5', 'USD2', 'EUR', 'EUR1'];

exports.handler = async function(event, context) {
  // Настраиваем CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Обрабатываем OPTIONS запросы для CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Настраиваем Puppeteer для использования Chromium в Netlify
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Переходим на страницу для получения курсов валют
    await page.goto('https://moneyshopphuket.com/contacts-ru', {
      waitUntil: 'domcontentloaded',
    });

    // Ждем загрузки данных
    await new Promise((resolve) => setTimeout(resolve, 2000));

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Ошибка получения данных:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Ошибка сервера' })
    };
  }
}; 