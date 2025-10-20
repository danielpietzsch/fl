var formats
var format35mm

function updateOutputs(e) {
  let largestFormat = formats[formats.length - 1]
  let sliderValue   = largestFormat.normalFocalLength() //default

  if (e && e.target.value) {
    sliderValue = parseInt(e.target.value)
  }

  for (var i = formats.length - 1; i >= 0; i--) {
    let outputElement = document.getElementById(_domIDForFormatName(formats[i].name))
    let equivalentFocalLength = Math.round(formats[i].equivalentToFocalLengthInFormat(sliderValue, largestFormat))

    if (formats[i].name === format35mm.name) {
      let diagonalFOV = 2 * Math.atan(formats[i].diagonalInMm() / (2 * equivalentFocalLength)) * (180 / Math.PI)
      outputElement.innerHTML = `<small title="Diagonal Field of View in degrees">⤢${diagonalFOV.toFixed(0)}°</small> ${equivalentFocalLength} mm`
    } else {
      outputElement.value = `${equivalentFocalLength} mm`
    }
  }
}

function init() {
  let form = document.getElementsByTagName('form')[0]
  form.style.display = 'initial'

  form.addEventListener('input', updateOutputs)

  format35mm = new ImagingFormat("35mm", 36, 24)
  format35mm.setCommonFocalLengths([10, 16, 21, 24, 28, 35, format35mm.diagonalInMm(), 50, 85, 100, 135, 200])

  formats = [
    new ImagingFormat("16mm", 10.26, 7.49),
    new ImagingFormat("Super 16", 12.52, 7.41),
    new ImagingFormat("Micro 4/3", 18, 13.5),
    new ImagingFormat("APS-C", 24, 16),
    new ImagingFormat("APS-H", 27.9, 18.6),
    format35mm,
    new ImagingFormat("Fuji GFX", 43.8, 32.9),
    new ImagingFormat("6x4.5", 56, 41.5),
    new ImagingFormat("6x6", 56, 56),
    new ImagingFormat("6x7", 56, 67),
    new ImagingFormat("70mm", 70.41, 52.63),
    new ImagingFormat("6x8", 56, 77),
    new ImagingFormat("6x9", 56, 84),
    new ImagingFormat("4x5", 120, 95),
    new ImagingFormat("8x10", 240, 190)
  ].sort(function(formatA, formatB) {
    if (formatA.diagonalInMm() < formatB.diagonalInMm()) return -1
    if (formatA.diagonalInMm() > formatB.diagonalInMm()) return 1
    return 0
  })

  _addUIElementsForFormatsToForm(formats, form)
  _initRangeSlider()
  _initTableRowListeners()

  _registerServiceWorker()
}

function _addUIElementsForFormatsToForm(formats, form) {
  let template  = document.getElementById('formatOutput')
  let tableBody = document.querySelector('form > table > tbody')

  formats.forEach(function (format, index, array) {
    let newformatOutput = document.importNode(template.content, true)

    newformatOutput.querySelector('td').textContent = format.name
    newformatOutput.querySelector('td').setAttribute('title', `Dimensions: ${format.widthInMm} x ${format.heightInMm} mm`)
    newformatOutput.querySelector('output').setAttribute('id', _domIDForFormatName(format.name))

    if (format.name === format35mm.name) {
      newformatOutput.querySelector('tr').setAttribute('class', 'reference-format')
    }

    tableBody.appendChild(newformatOutput)
  })
}

function _initRangeSlider() {
  let largestFormat     = formats[formats.length - 1]
  let focalLengthSlider = document.getElementById('focal-length')

  focalLengthSlider.setAttribute('max', Math.round(largestFormat.equivalentToFocalLengthInFormat(200, format35mm)))
  focalLengthSlider.value = largestFormat.normalFocalLength()

  let datalist = document.getElementById('popular-focal-lengths')

  format35mm.commonFocalLengths.forEach(function (focalLength, index, array) {
    datalist.insertAdjacentHTML('beforeend', `<option label="ƒ=${Math.round(focalLength)}mm in 35mm format">${Math.round(largestFormat.equivalentToFocalLengthInFormat(focalLength, format35mm))}</option>`)
  })
}

function _initTableRowListeners() {
  let tableRows = document.querySelectorAll('form > table > tbody > tr')

  tableRows.forEach(function(tr, index, array) {
    tr.addEventListener('click', function() {
      tableRows.forEach(function(trInner) {
        if (trInner !== tr) {
          trInner.classList.remove('selected')
        }

      })
      tr.classList.toggle('selected')
    })
  })
}

function _domIDForFormatName(name) {
  return `result_${name.replace('.', '').replace(' ', '').toLowerCase()}`
}

function _registerServiceWorker() {
  if (navigator.serviceWorker && !navigator.serviceWorker.controller) {
    console.log("Registering service worker!")
    navigator.serviceWorker.register('/serviceworker.js')
  }
}

window.onload = function() {
  init()
  updateOutputs()
}
