const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const valFLAG = ['SBP', 'RUB', 'USD20', 'USD5', 'USD2', 'EUR', 'EUR1'];

// Кэш для хранения данных о курсах валют
let ratesCache = {
  data: null,
  timestamp: 0
};

// Время жизни кэша в миллисекундах (15 минут)
const CACHE_TTL = 15 * 60 * 1000;

// Резервные данные на случай, если не удастся получить актуальные
const fallbackData = {
  "SBP": ["0.314 (3.18)", "0.314 (3.18)"],
  "RUB": ["0.314 (3.18)", "0.314 (3.18)"],
  "USD20": ["0.314 (3.18)", "0.314 (3.18)"],
  "USD5": ["0.314 (3.18)", "0.314 (3.18)"],
  "USD2": ["0.314 (3.18)", "0.314 (3.18)"],
  "EUR": ["0.314 (3.18)", "0.314 (3.18)"],
  "EUR1": ["0.314 (3.18)", "0.314 (3.18)"]
};

exports.handler = async function(event, context) {
  // Настраиваем CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'public, max-age=900' // Кэширование на стороне клиента на 15 минут
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
    const currentTime = Date.now();
    
    // Проверяем, есть ли актуальные данные в кэше
    if (ratesCache.data && (currentTime - ratesCache.timestamp) < CACHE_TTL) {
      console.log('Возвращаем данные из кэша');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(ratesCache.data)
      };
    }
    
    // Если кэш устарел или отсутствует, получаем новые данные
    console.log('Получаем свежие данные о курсах валют');
    
    try {
      // Настраиваем Puppeteer для использования Chromium в Netlify
      const browser = await puppeteer.launch({
        args: [...chromium.args, '--disable-features=AudioServiceOutOfProcess', '--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-sandbox'],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: true,
        ignoreHTTPSErrors: true
      });

      const page = await browser.newPage();
      
      // Устанавливаем таймаут для навигации
      page.setDefaultNavigationTimeout(30000);
      
      // Переходим на страницу для получения курсов валют
      await page.goto('https://moneyshopphuket.com/contacts-ru', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
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
        return null;
      });

      await browser.close();
      
      // Если данные получены успешно, обновляем кэш
      if (data) {
        // Обновляем кэш
        ratesCache = {
          data: data,
          timestamp: currentTime
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        };
      } else {
        throw new Error('Не удалось получить данные с сайта');
      }
    } catch (puppeteerError) {
      console.error('Ошибка при работе с Puppeteer:', puppeteerError);
      throw puppeteerError;
    }
  } catch (error) {
    console.error('Ошибка получения данных:', error);
    
    // Если есть данные в кэше, возвращаем их даже если они устарели
    if (ratesCache.data) {
      console.log('Возвращаем устаревшие данные из кэша из-за ошибки');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(ratesCache.data)
      };
    }
    
    // Если кэша нет, возвращаем резервные данные
    console.log('Возвращаем резервные данные');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackData)
    };
  }
}; 