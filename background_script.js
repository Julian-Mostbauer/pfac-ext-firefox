const titleCache = new Map();

function getPrimeFactors(n) {
  if (n <= 1n) return [];
  const factors = [];
  let divisor = 2n;
  
  // Only check divisors up to the square root of n to prevent freezing on huge primes
  while (n >= 2n && divisor * divisor <= n) {
    if (n % divisor === 0n) {
      factors.push(divisor);
      n = n / divisor;
    } else {
      divisor++;
    }
  }
  
  // If n is still greater than 1, then the remaining n is a prime itself
  if (n > 1n) {
    factors.push(n);
  }
  
  return factors;
}

browser.menus.create({
  id: "factorize-number",
  title: "Show Prime Factors",
  contexts: ["selection"]
});

browser.menus.create({
  id: "factorize-all",
  title: "Factorize All Numbers",
  contexts: ["all"]
});

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "factorize-number") {
    const selectedText = info.selectionText;
    // Remove spaces, commas, and dots
    const sanitizedText = selectedText.replace(/[\s,.]/g, '');

    let number;
    try {
      // Use BigInt to handle extremely large numbers without losing precision
      number = BigInt(sanitizedText);
    } catch (e) {
      console.error(`"${selectedText}" could not be parsed as a valid number.`);
      return;
    }

    let titleText = "";
    if (number <= 1n) {
      titleText = `No prime factors for ${number}.`;
    } else if (titleCache.has(number)) {
      titleText = titleCache.get(number);
    } else {
      const factors = getPrimeFactors(number);
      if (factors.length === 1 && factors[0] === number) {
        titleText = "Prime";
      } else {
        const counts = new Map();
        for (const f of factors) {
          counts.set(f, (counts.get(f) || 0) + 1);
        }
        const parts = [];
        for (const [f, count] of counts.entries()) {
          parts.push(count > 1 ? `${f}^${count}` : `${f}`);
        }
        titleText = `${number.toString()} = ` + parts.join(" × ");
      }
      titleCache.set(number, titleText);
    }

    // Send a message to the content script in the active tab
    browser.tabs.sendMessage(tab.id, {
      action: "show_factors",
      titleText: titleText
    });
  } else if (info.menuItemId === "factorize-all") {
    browser.tabs.sendMessage(tab.id, {
      action: "factorize_all"
    });
  }
});
