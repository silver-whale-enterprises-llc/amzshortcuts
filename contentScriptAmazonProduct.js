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

function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function createElementFromHTML(htmlString) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes
  return div.firstChild;
}

async function main() {
  console.log("executing");
  const bsrElement = document.querySelector(
    "#productDetails_detailBullets_sections1 > tbody > tr:nth-child(3) > td > span > span:nth-child(1)"
  );
  if (!bsrElement) return;

  const bsrText = bsrElement.innerText;
  // find category
  const categoryFinder = /(?:\d\sin\s)(.+)(?:\s\()/;
  const categoryMatch = categoryFinder.exec(bsrText);
  const category = categoryMatch.length > 1 ? categoryMatch[1] : null;
  console.log("category:", category);
  // find bsr number
  const bsrFinder = /(?:\#)((\d{1,3})(,\d{3})*)/;
  const bsrMatch = bsrFinder.exec(bsrText);
  const bsr = bsrMatch.length > 1 ? bsrMatch[1].replace(/,/g, "") : null;
  console.log("bsr:", bsr);

  if (category && bsr) {
    const sales = await getSalesEstimate(category, bsr);
    // const sales = await fakeGetSales(category, bsr);
    console.log("sales:", sales);
    const template = await getTemplate();
    const bylineInfoElement = document.querySelector("#bylineInfo_feature_div");
    const injectElement = createElementFromHTML(template.replace("{ESTIMATED_SALES}", sales));
    insertAfter(injectElement, bylineInfoElement);
  }
}

main();
