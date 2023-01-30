export function addCell(row, cellIndex, text) {
  const cell = row.insertCell(cellIndex)

  let newText = document.createTextNode(text);
  cell.appendChild(newText);
}

export function emptyTable(table) {
  var rowstoDelete = table.querySelectorAll("tbody tr");
  [].slice.call(rowstoDelete).forEach(function(row) {
    row.remove()
  });
}