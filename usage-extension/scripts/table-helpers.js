export function tableAddCell(row, cellIndex, text, url = null) {
  const cell = row.insertCell(cellIndex)

  let element;
  if (url) {
    element = document.createElement("a");
    element.setAttribute("href", url);
    element.innerHTML = text;
    element.target = "_blank";
    element.onclick = (e) => {
      e.preventDefault();
      chrome.tabs.create({
        url,
        active: false,
       });
      return false;
    }
  } else {
    element = document.createTextNode(text);
  }

  cell.appendChild(element);
}

export function tableAddCellLink() {
  const cell = row.insertCell(row, cellIndex, url, text)

  let newText = document.createTextNode(text);
  cell.appendChild(newText);
}

export function tableEmpty(table) {
  var rowsToDelete = table.querySelectorAll("tbody tr");
  [].slice.call(rowsToDelete).forEach(function(row) {
    row.remove()
  });
}