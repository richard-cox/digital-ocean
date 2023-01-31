export function pureShowElement(element, show) {
  if (show) {
    element.removeAttribute('hidden')
  } else {
    element.setAttribute('hidden', null)
  }
}

export function pureEnableElement(element, enable) {
  if (enable) {
    element.removeAttribute('disabled')
  } else {
    element.setAttribute('disabled', "")
  }

}