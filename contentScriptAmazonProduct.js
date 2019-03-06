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

const AMZ_ROOT_CATEGORIES = [
  "Appliances",
  "Arts, Crafts & Sewing",
  "Automotive",
  "Baby",
  "Beauty & Personal Care",
  "Books",
  "Camera & Photo",
  "Cell Phones & Accessories",
  "Clothing, Shoes & Jewelry",
  "Computers & Accessories",
  "Electronics",
  "Grocery & Gourmet Food",
  "Health & Household",
  "Home and Garden",
  "Home & Kitchen",
  "Industrial & Scientific",
  "Jewelry",
  "Kindle Store",
  "Kitchen & Dining",
  "Musical Instruments",
  "Office Products",
  "Patio, Lawn & Garden",
  "Pet Supplies",
  "Shoes",
  "Software",
  "Sports & Outdoors",
  "Tools & Home Improvement",
  "Toys & Games",
  "Watches",
  "Video Games"
];

function dataIsValid(category, bsr) {
  if (!category) {
    console.log("No category found!");
    // TODO: show template "No category found for this product! report error"
    return false;
  }

  if (!bsr) {
    console.log("No BSR found!");
    // TODO: show template "BSR not found for this product! report error"
    return false;
  }

  if (category && !AMZ_ROOT_CATEGORIES.includes(category)) {
    console.log(`No sales estimate for category: "${category}"`);
    // TODO: show template "no sales estimate available"
    return false;
  }

  return true;
}

async function main() {
  console.log("executing");
  const productInfoElement = getProductInfoElement();
  console.log("bsrElement:", productInfoElement);
  if (!productInfoElement) return;

  const bsrText = productInfoElement.textContent.replace(/\s+/g, " ");
  // find category
  const categoryFinder = /(?:Best Sellers Rank:? )(?:(?:\#)(?:\d{1,3})(?:,?\d{3})* in )(.+?)(?:\s\(|\s>|\s#|\sDate first listed on Amazon)/;
  const categoryMatch = categoryFinder.exec(bsrText);
  console.log("categoryMatch:", categoryMatch);
  const category = categoryMatch.length > 1 ? categoryMatch[1] : null;
  console.log("category:", category);
  // find bsr number
  const bsrFinder = /(?:Best Sellers Rank:? )(?:\#)((\d{1,3})(,?\d{3})*)/;
  const bsrMatch = bsrFinder.exec(bsrText);
  const bsr = bsrMatch.length > 1 ? bsrMatch[1].replace(/,/g, "") : null;
  console.log("bsr:", bsr);

  if (!dataIsValid(category, bsr)) return;

  // const sales = await fakeGetSales(category, bsr);
  const sales = await getSalesEstimate(category, bsr);
  console.log("sales:", sales);

  if (!sales) {
    console.log("No sales estimate available");
    // TODO: show template "no sales estimate available"
    return;
  }

  // TODO: implement template parsing function using regular expressions
  const template = await getTemplate();
  const injectElement = createElementFromHTML(template.replace("{ESTIMATED_SALES}", sales));
  const injectReference = getInjectReferenceElement();
  insertBefore(injectElement, injectReference);
}

main();
