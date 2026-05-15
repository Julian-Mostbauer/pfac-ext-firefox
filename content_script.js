const titleCache = new Map();

// We include the prime calculation logic here as well to process the whole page extremely fast locally
function getPrimeFactors(n) {
  if (n <= 1n) return [];
  const factors = [];
  let divisor = 2n;
  
  while (n >= 2n && divisor * divisor <= n) {
    if (n % divisor === 0n) {
      factors.push(divisor);
      n = n / divisor;
    } else {
      divisor++;
    }
  }
  if (n > 1n) {
    factors.push(n);
  }
  return factors;
}

function factorizeAll() {
  // Wait until the body is available
  if (!document.body) {
    setTimeout(factorizeAll, 100);
    return;
  }

  // Scan the entire document for text nodes
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  let node;
  
  while (node = walker.nextNode()) {
    const parent = node.parentNode;
    // Skip scripts, styles, and nodes we've already highlighted
    if (parent && (parent.nodeName === 'SCRIPT' || parent.nodeName === 'STYLE' || parent.nodeName === 'NOSCRIPT' || parent.hasAttribute('data-factorized'))) {
      continue;
    }
    if (node.nodeValue.trim() !== '') {
      nodes.push(node);
    }
  }

  // Matches sequences of digits separated by commas, dots or spaces
  const numberRegex = /\b\d+(?:[.,\s]\d+)*\b/g;
  
  nodes.forEach(textNode => {
    const text = textNode.nodeValue;
    let match;
    numberRegex.lastIndex = 0;
    
    if (!numberRegex.test(text)) return;
    
    numberRegex.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    
    while ((match = numberRegex.exec(text)) !== null) {
      const matchedString = match[0];
      const sanitizedText = matchedString.replace(/[\s,.]/g, '');
      let num;
      
      try {
        num = BigInt(sanitizedText);
      } catch (e) {
        continue;
      }

      if (num > 1n) {
        // Add the text before the number
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
        }
        
        // Create the highlighted span
        const span = document.createElement('span');
        span.setAttribute('data-factorized', 'true');
        
        let titleText = titleCache.get(num);
        
        if (!titleText) {
          const factors = getPrimeFactors(num);
          if (factors.length === 1 && factors[0] === num) {
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
            titleText = `${num.toString()} = ` + parts.join(" × ");
          }
          titleCache.set(num, titleText);
        }
        
        span.title = titleText;
        span.style.borderBottom = "1px dashed #999";
        span.style.cursor = "help";
        span.style.backgroundColor = titleText === "Prime" ? "rgba(0, 255, 0, 0.2)" : "rgba(255, 255, 0, 0.2)";
        span.textContent = matchedString;
        
        fragment.appendChild(span);
        lastIndex = numberRegex.lastIndex;
      }
    }
    
    // If we found and replaced at least one number
    if (lastIndex > 0) {
      // Add any remaining text after the last number
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }
      // Replace the original text node with our new fragment
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "show_factors") {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    // Create a span element to wrap the selected text
    const span = document.createElement("span");
    
    // Use the title attribute to show the tooltip on hover (alt text behavior)
    span.title = request.titleText;
    
    // Add a subtle dashed underline and a help cursor so you know it's hoverable
    span.style.borderBottom = "1px dashed #999";
    span.style.cursor = "help";
    span.style.backgroundColor = request.titleText === "Prime" ? "rgba(0, 255, 0, 0.2)" : "rgba(255, 255, 0, 0.2)"; // Green for prime, yellow otherwise

    try {
      // Extract the selected text/HTML and put it inside our span
      const contents = range.extractContents();
      span.appendChild(contents);
      
      // Insert the newly wrapped span back into the document
      range.insertNode(span);
      
      // Clear the selection so the user can immediately hover over it
      selection.removeAllRanges();
    } catch (e) {
      console.error("Prime Factorizer: Could not wrap selection. The selection might be crossing multiple HTML elements.", e);
    }
  } else if (request.action === "factorize_all") {
    factorizeAll();
  }
});

// Check options on page load and run automatically if enabled
browser.storage.local.get({
  autoFactorize: false
}).then((items) => {
  if (items.autoFactorize) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", factorizeAll);
    } else {
      factorizeAll();
    }
  }
});
