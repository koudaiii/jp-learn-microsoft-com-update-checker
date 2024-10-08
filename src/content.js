// languageLabels is a dictionary that maps message from language codes to the corresponding language
// Default languageLabels is 'last updated on'
// Add more languageLabels as needed
const languageLabels = {
  'ja-jp': '英語版の更新日',
  // Add more language labels as needed. For example: 'fr-fr': 'Dernière mise à jour le',
};

// timeAgoLabels is a dictionary that maps message from language codes to the corresponding language
// Default timeAgoLabels is 'years ago', 'days ago', 'hours ago', 'minutes ago', 'just now'
// Add more timeAgoLabels as needed
const timeAgoLabels = {
  'ja-jp': {
  years: '年前に更新',
  days: '日前に更新',
  hours: '時間前に更新',
  minutes: '分前に更新',
  justNow: '今更新されたばかり',
  },
  // Add more language labels as needed. For example:
  // 'fr-fr': { years: 'il y a ans', days: 'il y a jours', hours: 'il y a heures', minutes: 'il y a minutes', justNow: 'à l\'instant' },
};

(async () => {
  // Get current URL
  const currentUrl = window.location.href;

  // Use a regular expression to extract the language code
  const languageCodeMatch = currentUrl.match(/https:\/\/learn\.microsoft\.com\/([^\/]+)\//);
  const currentLang = languageCodeMatch ? languageCodeMatch[1] : null;
  if (!currentLang) return;

  // Check if the page(https://learn.microsoft.com/en-us) is in en-us, if so, return
  const lang = 'en-us';
  if (currentLang === lang) return;

  const debug = new URLSearchParams(window.location.search).get("jp-learn-microsoft-com-update-checker-debug");

  // Get data-article-date element in current page
  const dataArticleDateElement = document.querySelector('time[data-article-date]');
  if (!dataArticleDateElement) return;

  // Parse article date
  const articleDateStr = dataArticleDateElement.getAttribute("datetime");
  const articleDate = new Date(articleDateStr);

  // Translate URL to English
  const englishUrl = currentUrl.replace(`/${currentLang}/`, "/en-us/");

  try {
    // Get English page and parse update date
    const response = await fetch(englishUrl);
    const data = await response.text();

    // Parse HTML in English page
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, "text/html");

    const englishDateStr = doc.querySelector('time[data-article-date]')?.getAttribute("datetime");
    if (!englishDateStr) return;
    const englishDate = new Date(englishDateStr);

    // Add update info to current page
    // Calculate the difference in time between the current date and the English update date
    const currentDate = new Date();
    const timeDifference = currentDate - englishDate;

    // Create a new paragraph element to display the update information
    let timeAgo;
    const years = Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 365));
    const days = Math.floor((timeDifference % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

    const labels = timeAgoLabels[currentLang] || {
      years: 'years ago',
      days: 'days ago',
      hours: 'hours ago',
      minutes: 'minutes ago',
      justNow: 'just now'
    };

      if (years > 0) {
        timeAgo = ` ${years} ${labels.years}`;
      } else if (days > 0) {
        timeAgo = ` ${days} ${labels.days}`;
      } else if (hours > 0) {
        timeAgo = ` ${hours} ${labels.hours}`;
      } else if (minutes > 0) {
        timeAgo = ` ${minutes} ${labels.minutes}`;
      } else {
        timeAgo = labels.justNow;
      }
    let timeAgoStr = ` (${timeAgo})`;

    const updateInfo = document.createElement("p");
    dataArticleDateElement.parentElement.appendChild(updateInfo);

    const updateClass = () => {
      // if theme is selected, apply appropriate text color based on theme
      const textColorClass = ((theme) => {
        if (theme === "dark") return "text-color-dark";
        if (theme === "high-contrast") return "text-color-high-contrast";
        if (theme === "light") return "text-color-light";
        return "text-color";
      })(document.querySelector('button[data-theme-to][aria-pressed="true"]').getAttribute("data-theme-to"));
      console.log("textColorClass:", textColorClass);

      // Add icon to update info
      informationIcon = "";

      console.log("English date:", englishDate);
      console.log("Article date:", articleDate);
      console.log("timeAgoStr:", timeAgoStr);

      // Compare English date and Article date
      if (englishDate > articleDate || debug === "true") {
        // Display alert if English page is updated
        updateInfo.className = "alert is-primary"; // <class="alert is-primary"> is defined in CSS
        updateInfo.style.margin = "5px";
        updateInfo.style.padding = "10px";
        informationIcon = `<span class="icon"><span class="docon docon-status-error-outline" aria-hidden="true" style="margin: 0px"></span></span>`;
      } else {
        // Display info if English page is not updated
        updateInfo.style.marginTop = "0"; // <p> default margin-top is 1rem
        updateInfo.style.marginLeft = "3px"; // <p> default margin-left is 0
        updateInfo.className = textColorClass; // Apply appropriate text color based on theme
      }

      // Set update info text based on language
      const languageLabel = languageLabels[currentLang] || 'last updated on';

      // Display update info
      updateInfo.innerHTML = informationIcon + `${languageLabel}: <a href="${englishUrl}" target="_blank" class="${textColorClass}">${englishDate.toLocaleDateString(currentLang)}${timeAgoStr}</a>`;
    }
    updateClass();
    const observer = new MutationObserver(updateClass);
    observer.observe(document.querySelector('button[data-theme-to][aria-pressed="true"]'), { attributes: true });
  } catch (error) {
    console.error("Error fetching English page:", error);
  }
})();
