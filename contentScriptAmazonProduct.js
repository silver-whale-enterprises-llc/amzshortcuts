function makeRequest(method, url) {
  return new Promise(function(resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function() {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}

async function getSalesEstimate(category, bsr) {
  return await makeRequest(
    "GET",
    `https://amzscout.net/estimator/v1/sales?domain=COM&category=${encodeURIComponent(category)}&rank=${bsr}`
  ).then(response => JSON.parse(response).sales);
}

async function fakeGetSales(category, bsr) {
  return await Promise.resolve(100);
}

async function getTemplate() {
  return await makeRequest("GET", chrome.extension.getURL("templates/estimatedSales.html"));
}

function insertBefore(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode);
}

function createElementFromHTML(htmlString) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes
  return div.firstChild;
}

function getProductInfoElement() {
  let bsrElement = document.querySelector("#productDetails_detailBullets_sections1");
  if (!bsrElement) {
    bsrElement = document.querySelector("#SalesRank");
  }
  return bsrElement;
}

function getInjectReferenceElement() {
  let injectReference = document.querySelector("#desktop_unifiedPrice");
  if (!injectReference) {
    injectReference = document.querySelector("#scenes_stage");
  }

  return injectReference;
}

async function main() {
  console.log("executing");
  const productInfoElement = getProductInfoElement();
  console.log("bsrElement:", productInfoElement);
  if (!productInfoElement) return;

  const bsrText = productInfoElement.textContent.replace(/\s+/g, " ");
  // find category
  const categoryFinder = /(?:Best Sellers Rank:? )(?:(?:\#)(?:\d{1,3})(?:,?\d{3})* in )(.+?)(?:\s\(|\s>)/;
  const categoryMatch = categoryFinder.exec(bsrText);
  console.log("categoryMatch:", categoryMatch);
  const category = categoryMatch.length > 1 ? categoryMatch[1] : null;
  console.log("category:", category);
  // find bsr number
  const bsrFinder = /(?:Best Sellers Rank:? )(?:\#)((\d{1,3})(,?\d{3})*)/;
  const bsrMatch = bsrFinder.exec(bsrText);
  const bsr = bsrMatch.length > 1 ? bsrMatch[1].replace(/,/g, "") : null;
  console.log("bsr:", bsr);

  if (category && bsr) {
    // const sales = await fakeGetSales(category, bsr);
    const sales = await getSalesEstimate(category, bsr);
    console.log("sales:", sales);
    const template = await getTemplate();
    const injectElement = createElementFromHTML(template.replace("{ESTIMATED_SALES}", sales));
    const injectReference = getInjectReferenceElement();
    insertBefore(injectElement, injectReference);
  }
}

main();
