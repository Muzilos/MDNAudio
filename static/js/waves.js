const myAudio = document.querySelector('audio');
const pre = document.querySelector('pre');
const myScript = document.querySelector('script');
const range = document.querySelector('#gain');
const gainval = document.querySelector('#gainval')
const freqResponseOutput = document.querySelector('.freq-response-output');
// create float32 arrays for getFrequencyResponse
const myFrequencyArray = new Float32Array(5);
myFrequencyArray[0] = 1000;
myFrequencyArray[1] = 2000;
myFrequencyArray[2] = 3000;
myFrequencyArray[3] = 4000;
myFrequencyArray[4] = 5000;
const magResponseOutput = new Float32Array(5);
const phaseResponseOutput = new Float32Array(5);

// Hacks to deal with different function names in different browsers
window.requestAnimFrame = (function () {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback, element) {
      window.setTimeout(callback, 1000 / 60);
    };
})();

// Display gain value
updateGainDisplay()
function updateGainDisplay() {
  gainval.innerHTML = 'Gain: ' + '<strong>' + range.value + '<strong>';
}
// getUserMedia block - grab stream
// put it into a MediaStreamAudioSourceNode
// also output the visuals into a video element
if (navigator.mediaDevices) {
  console.log('getUserMedia supported.');
  navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    })
    .then(function (stream) {
      const audioCtx = new AudioContext();

      let analyserNode;
      let javascriptNode;
      let sourceNode;
      let audioPlaying = false;
      let sampleSize = 4096;
      let amplitudeArray;
      let canvasWidth = 1024;
      let canvasHeight = 512;

      let ctx;
      ctx = document.querySelector('#canvas').getContext('2d');

      // Create a MediaStreamAudioSourceNode
      // Feed the HTMLMediaElement into it
      const source = audioCtx.createMediaStreamSource(stream);
      // Create a biquadfilter
      const biquadFilter = audioCtx.createBiquadFilter();
      biquadFilter.type = "lowshelf";
      biquadFilter.frequency.value = sampleSize;
      biquadFilter.gain.value = range.value;
      // connect the AudioBufferSourceNode to the gainNode
      // and the gainNode to the destination, so we can play the
      // music and adjust the volume using the mouse cursor
      source.connect(biquadFilter);
      // biquadFilter.connect(audioCtx.destination);
      // Get new mouse pointer coordinates when mouse is moved
      // then set new gain value
      range.oninput = function () {
        biquadFilter.gain.value = range.value;
        updateGainDisplay();
      }

      function calcFrequencyResponse() {
        biquadFilter.getFrequencyResponse(myFrequencyArray, magResponseOutput, phaseResponseOutput);
        for (i = 0; i <= myFrequencyArray.length - 1; i++) {
          let listItem = document.createElement('li');
          listItem.innerHTML = '<strong>' + myFrequencyArray[i] + 'Hz</strong>: Magnitude ' + magResponseOutput[i] + ', Phase ' + phaseResponseOutput[i] + ' radians.';
          freqResponseOutput.appendChild(listItem);
        }
      }
      calcFrequencyResponse();

      document.querySelector('#start_button').addEventListener('click', function (e) {
        e.preventDefault();
        audioPlaying = true;
        console.log(audioPlaying)
        // Set up the audio Analyser, the Source Buffer and javascriptNode
        setupAudioNodes();
        // setup the event handler that is triggered every time enough samples have been collected
        // trigger the audio analysis and draw the results
        javascriptNode.onaudioprocess = function () {
          // get the Time Domain data for this sample
          analyserNode.getByteTimeDomainData(amplitudeArray);
          // draw the display if the audio is playing
          if (audioPlaying == true) {
            requestAnimFrame(drawTimeDomain);
          }
        }
      });

      // Stop the audio playing
      document.querySelector('#stop_button').addEventListener('click', function (e) {
        e.preventDefault();
        audioPlaying = false;
        console.log(audioPlaying)
      });

      function drawTimeDomain() {
        clearCanvas();
        for (let i = 0; i < amplitudeArray.length; i++) {
          // console.log(amplitudeArray[i])
          let value = amplitudeArray[i] / 256;
          let y = canvasHeight - (canvasHeight * value) - 1;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(i, y, 1, 1);
        }
      }

      function clearCanvas() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      }

      function setupAudioNodes() {
        // sourceNode     = audioCtx.createBufferSource();
        analyserNode = audioCtx.createAnalyser();
        javascriptNode = audioCtx.createScriptProcessor(sampleSize, 1, 1);
        // Create the array for the data values
        amplitudeArray = new Uint8Array(analyserNode.frequencyBinCount * 2);
        // Now connect the nodes together
        // sourceNode.connect(audioCtx.destination);
        biquadFilter.connect(analyserNode);
        analyserNode.connect(javascriptNode);
        javascriptNode.connect(audioCtx.destination);
      }


    })
    .catch(function (err) {
      console.log('The following gUM error occured: ' + err);
    });

} else {
  console.log('getUserMedia not supported on your browser!');
}

// dump script to pre element
// pre.innerHTML = myScript.innerHTML;