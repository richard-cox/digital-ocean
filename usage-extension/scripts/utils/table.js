import { openTabKeepContext } from './chrome-extension.js';

export function tableAddCell(row, cellIndex, text, url = null) {
  const cell = row.insertCell(cellIndex)
  const parts = text.split('<br>');
  parts.forEach((p, index) => {
    cell.appendChild(document.createTextNode(p));
    if (index < parts.length - 1) {
      cell.appendChild(document.createElement('br'));
    }
  });

  return cell;
}

export function tableAddCellLink(row, cellIndex, text, url) {
  const cell = row.insertCell(cellIndex)

  const element = document.createElement('a');
  element.setAttribute('href', url);
  element.innerHTML = text;
  element.target = '_blank';
  element.onclick = (e) => {
    e.preventDefault();
    openTabKeepContext(url);
    return false;
  }
  cell.appendChild(element);

  return cell;
}

export function tableAddCellButton(row, cellIndex, buttonText, buttonIcon, buttonClick) {
  const cell = row.insertCell(cellIndex);

  const button = document.createElement('button');
  button.classList.add('pure-button')
  button.classList.add('pure-button-primary')
  button.onclick = buttonClick;

  const icon = document.createElement('i');
  icon.classList.add('bi');
  icon.classList.add(buttonIcon);

  button.appendChild(icon);

  button.innerHTML += buttonText

  cell.appendChild(button);

  return cell;
}

export function tableEmpty(table) {
  var rowsToDelete = table.querySelectorAll('tbody tr');
  [].slice.call(rowsToDelete).forEach(function(row) {
    row.remove()
  });
}
