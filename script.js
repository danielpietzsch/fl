var formats
var format35mm

// Temporary: the logarithmic slider is only used with ?scale=log
const logScale = new URLSearchParams(location.search).get('scale') === 'log'

// The slider's range, as focal lengths in 35mm format.
// Linear, each step is 1 mm. Logarithmic, each step changes the focal length by the same factor (about 2%).
const minFocalLength = 10
const maxFocalLength = logScale ? 500 : 200
const sliderSteps    = 190

function updateOutputs() {
  let focalLengthSlider = document.getElementById('focal-length')
  let fl35mm = _focalLengthForSliderValue(parseInt(focalLengthSlider.value))

  // Updating the readout next to the slider
  let diagonalFOV = 2 * Math.atan(format35mm.diagonalInMm() / (2 * fl35mm)) * (180 / Math.PI)
  document.getElementById('focal-length-35mm').value = Math.round(fl35mm)
  document.getElementById('field-of-view').value = `${diagonalFOV.toFixed(0)}°`

  // What screen readers announce when the slider changes (the outputs themselves are silenced)
  focalLengthSlider.setAttribute('aria-valuetext', `${Math.round(fl35mm)} mm in 35mm format, ${diagonalFOV.toFixed(0)}° field of view`)

  // Updating all focal length values
  for (var i = formats.length - 1; i >= 0; i--) {
    let outputElement = document.getElementById(_domIDForFormatName(formats[i].name))
    let equivalentFocalLength = Math.round(formats[i].equivalentToFocalLengthInFormat(fl35mm, format35mm))
    outputElement.value = equivalentFocalLength
  }
}

function init() {
  let form = document.getElementsByTagName('form')[0]

  form.addEventListener('input', updateOutputs)

  format35mm = new ImagingFormat("35mm", 36, 24)
  format35mm.setCommonFocalLengths([10, 16, 21, 24, 28, 35, format35mm.diagonalInMm(), 50, 85, 100, 135, 200, 300, 500])

  formats = [
    new ImagingFormat("16mm", 10.26, 7.49),
    new ImagingFormat("Super 16", 12.52, 7.41),
    new ImagingFormat("Micro 4/3", 18, 13.5),
    new ImagingFormat("APS-C", 24, 16),
    new ImagingFormat("APS-H", 27.9, 18.6),
    format35mm,
    new ImagingFormat("Fuji GFX", 43.8, 32.9),
    // new ImagingFormat("Polaroid Go", 46, 47),
    new ImagingFormat("6x4.5", 56, 41.5),
    new ImagingFormat("6x6", 56, 56),
    new ImagingFormat("6x7", 56, 67),
    new ImagingFormat("70mm", 70.41, 52.63),
    new ImagingFormat("6x8", 56, 77),
    new ImagingFormat("6x9", 56, 84),
    new ImagingFormat("Polaroid", 77, 79),
    new ImagingFormat("4x5", 120, 95),
    new ImagingFormat("8x10", 240, 190)
  ].sort(function(formatA, formatB) {
    if (formatA.diagonalInMm() < formatB.diagonalInMm()) return -1
    if (formatA.diagonalInMm() > formatB.diagonalInMm()) return 1
    return 0
  })

  _addUIElementsForFormats(formats)
  _initRangeSlider()
  // Temporary: marking the current scale in the switch in the footer
  document.querySelector(`[data-scale="${logScale ? 'log' : 'linear'}"]`).setAttribute('aria-current', 'true')
  _initTableRowListeners()

  _registerServiceWorker()
}

function _addUIElementsForFormats(formats) {
  let template  = document.getElementById('formatOutput')
  let tableBody = document.querySelector('table.interactive > tbody')

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
  let focalLengthSlider = document.getElementById('focal-length')

  focalLengthSlider.setAttribute('max', sliderSteps)
  focalLengthSlider.value = _sliderValueForFocalLength(format35mm.diagonalInMm())

  let datalist = document.getElementById('popular-focal-lengths')

  format35mm.commonFocalLengths.forEach(function (focalLength, index, array) {
    datalist.insertAdjacentHTML('beforeend', `<option label="ƒ=${Math.round(focalLength)}mm in 35mm format">${_sliderValueForFocalLength(focalLength)}</option>`)
  })
}

function _focalLengthForSliderValue(sliderValue) {
  // The step closest to a popular focal length snaps to it, so all of them can be reached exactly
  let popularFocalLength = format35mm.commonFocalLengths.find(function (popular) {
    return Math.abs(_sliderPositionForFocalLength(popular) - sliderValue) <= 0.5
  })
  if (popularFocalLength) return popularFocalLength

  let fraction = sliderValue / sliderSteps
  if (logScale) {
    return minFocalLength * Math.pow(maxFocalLength / minFocalLength, fraction)
  } else {
    return minFocalLength + (maxFocalLength - minFocalLength) * fraction
  }
}

function _sliderValueForFocalLength(focalLength) {
  return Math.round(_sliderPositionForFocalLength(focalLength))
}

// The exact (unrounded) slider position for a focal length
function _sliderPositionForFocalLength(focalLength) {
  if (logScale) {
    return sliderSteps * Math.log(focalLength / minFocalLength) / Math.log(maxFocalLength / minFocalLength)
  } else {
    return sliderSteps * (focalLength - minFocalLength) / (maxFocalLength - minFocalLength)
  }
}

function _initTableRowListeners() {
  let tableRows = document.querySelectorAll('table.interactive > tbody > tr')

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
