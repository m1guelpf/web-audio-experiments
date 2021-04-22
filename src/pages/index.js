import { useEffect, useRef } from 'react'

const notes = [
	{ name: 'C', frequency: 261.63 },
	{ name: 'C#', frequency: 277.18 },
	{ name: 'D', frequency: 293.66 },
	{ name: 'D#', frequency: 311.13 },
	{ name: 'E', frequency: 329.63 },
	{ name: 'F', frequency: 349.23 },
	{ name: 'F#', frequency: 369.99 },
	{ name: 'G', frequency: 392.0 },
	{ name: 'G#', frequency: 415.3 },
	{ name: 'A', frequency: 440.0 },
	{ name: 'A#', frequency: 466.16 },
	{ name: 'B', frequency: 493.88 },
	{ name: 'C', frequency: 523.25 },
]

const Index = () => {
	if (typeof window === 'undefined') return null

	const canvasRef = useRef(null)

	const audioContext = new AudioContext()
	const analyser = audioContext.createAnalyser()
	const primaryGainControl = audioContext.createGain()
	primaryGainControl.gain.setValueAtTime(0.05, 0)
	primaryGainControl.connect(analyser)
	analyser.connect(audioContext.destination)

	analyser.fftSize = 2048
	let dataArray = new Uint8Array(analyser.frequencyBinCount)

	useEffect(() => {
		if (!canvasRef.current) return

		console.log(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight)

		const canvasCtx = canvasRef.current.getContext('2d')
		canvasCtx.clearRect(0, 0, canvasRef.current.offsetWidth, canvasRef.current.offsetHeight)

		const drawAnalyserFrame = () => {
			requestAnimationFrame(drawAnalyserFrame)

			analyser.getByteTimeDomainData(dataArray)
			canvasCtx.fillStyle = 'rgb(255, 255, 255)'
			canvasCtx.fillRect(0, 0, canvasRef.current.offsetWidth, canvasRef.current.offsetHeight)
			canvasCtx.lineWidth = 1.5
			canvasCtx.strokeStyle = 'rgb(0, 0, 0)'
			canvasCtx.beginPath()

			var sliceWidth = (canvasRef.current.offsetWidth * 1.0) / analyser.frequencyBinCount
			var x = 0

			for (var i = 0; i < analyser.frequencyBinCount; i++) {
				var v = dataArray[i] / 128.0
				var y = (v * canvasRef.current.offsetHeight) / 2

				if (i === 0) canvasCtx.moveTo(x, y)
				else canvasCtx.lineTo(x, y)

				x += sliceWidth
			}
			canvasCtx.lineTo(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight / 2)
			canvasCtx.stroke()
		}

		drawAnalyserFrame()
	}, [canvasRef.current])

	const hihatBuffer = fetch('https://unpkg.com/@teropa/drumkit@1.1.0/src/assets/hatOpen2.mp3')
		.then(res => res.arrayBuffer())
		.then(soundBuffer => audioContext.decodeAudioData(soundBuffer))

	const snareFilter = audioContext.createBiquadFilter()
	snareFilter.type = 'highpass'
	snareFilter.frequency.value = 1500 // Measured in Hz
	snareFilter.connect(primaryGainControl)

	const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 1 /* 1 second */, audioContext.sampleRate)
	const channelData = buffer.getChannelData(0)

	// Fill our buffer with white noise
	for (let i = 0; i < buffer.length; i++) channelData[i] = Math.random() * 2 - 1

	const playWhiteNoise = () => {
		const whiteNoiseSource = audioContext.createBufferSource()
		whiteNoiseSource.buffer = buffer
		whiteNoiseSource.connect(primaryGainControl)

		whiteNoiseSource.start()
	}

	const playSnareDrum = () => {
		const snareSource = audioContext.createBufferSource()
		snareSource.buffer = buffer

		// Control the gain of our snare white noise
		const snareGain = audioContext.createGain()
		snareGain.gain.setValueAtTime(1, audioContext.currentTime)
		snareGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
		snareSource.connect(snareGain)
		snareGain.connect(snareFilter)
		snareSource.start()
		snareSource.stop(audioContext.currentTime + 0.2)

		// Set up an oscillator to provide a 'snap' sound
		const snareOscillator = audioContext.createOscillator()
		snareOscillator.type = 'triangle'
		snareOscillator.frequency.setValueAtTime(100, audioContext.currentTime)

		// Control the gain of our snare oscillator
		const oscillatorGain = audioContext.createGain()
		oscillatorGain.gain.setValueAtTime(0.7, audioContext.currentTime)
		oscillatorGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
		snareOscillator.connect(oscillatorGain)
		oscillatorGain.connect(primaryGainControl)
		snareOscillator.start()
		snareOscillator.stop(audioContext.currentTime + 0.2)
	}

	const playKickDrum = () => {
		const kickOscillator = audioContext.createOscillator()
		// Frequency in Hz. This corresponds to a C note.
		kickOscillator.frequency.setValueAtTime(150, audioContext.currentTime)
		kickOscillator.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5)

		const kickGain = audioContext.createGain()
		kickGain.gain.setValueAtTime(1, 0)
		kickGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5)
		kickOscillator.connect(kickGain)
		kickGain.connect(primaryGainControl)

		kickOscillator.start()
		// This will stop the oscillator after half a second.
		kickOscillator.stop(audioContext.currentTime + 0.5)
	}

	const playHiHat = async () => {
		const hihatSource = audioContext.createBufferSource()
		hihatSource.buffer = await hihatBuffer

		hihatSource.connect(primaryGainControl)
		hihatSource.start()
	}

	const playNote = frequency => {
		const now = audioContext.currentTime
		const noteOscillator = audioContext.createOscillator()
		noteOscillator.type = 'square'
		noteOscillator.frequency.setValueAtTime(frequency, now)

		const vibrato = audioContext.createOscillator()
		vibrato.frequency.value = 10 // 10 Hz
		const vibratoGain = audioContext.createGain()
		vibratoGain.gain.value = 1.5
		vibrato.connect(vibratoGain)
		vibratoGain.connect(noteOscillator.frequency)
		vibrato.start()

		const attackTime = 0.2
		const decayTime = 0.3
		const sustainLevel = 0.7
		const releaseTime = 0.2
		const duration = 1
		const noteGain = audioContext.createGain()
		noteGain.gain.setValueAtTime(0, 0)
		noteGain.gain.linearRampToValueAtTime(1, now + attackTime)
		noteGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime)
		noteGain.gain.setValueAtTime(sustainLevel, now + duration - releaseTime)
		noteGain.gain.linearRampToValueAtTime(0, now + duration)

		noteOscillator.start()
		noteOscillator.stop(now + 1)
		noteOscillator.connect(noteGain)
		noteGain.connect(primaryGainControl)
	}

	return (
		<div className="p-4">
			<div className="mb-4 space-y-2 sm:space-y-0.5">
				<h1 className="text-3xl font-medium">Exploring the Web Audio API</h1>
				<p>Making a simple synth with nothing but white noise and Web APIs to learn how sound works.</p>
				<p>
					The code for this experiment is <span className="line-through text-gray-700">a complete mess</span>{' '}
					<a href="https://github.com/m1guelpf/web-audio-experiments/blob/main/src/pages/index.js" target="_blank" className="text-blue-600 hover:underline">
						available on GitHub
					</a>
					!
				</p>
				<p>
					You can also{' '}
					<a href="https://twitter.com/m1guelpf" target="_blank" className="text-blue-600 hover:underline">
						follow me on Twitter
					</a>{' '}
					to keep up with any other experiments I make.
				</p>
			</div>
			<div className="mb-3">
				<p className="font-medium text-xl mb-1">Drums</p>
				<div className="flex items-center space-x-1.5">
					<button className="border rounded-lg p-1 focus:outline-none focus:ring" onClick={playWhiteNoise}>
						white noise
					</button>
					<button className="border rounded-lg p-1 focus:outline-none focus:ring" onClick={playSnareDrum}>
						snare drum
					</button>
					<button className="border rounded-lg p-1 focus:outline-none focus:ring" onClick={playKickDrum}>
						kick drum
					</button>
					<button className="border rounded-lg p-1 focus:outline-none focus:ring" onClick={playHiHat}>
						hi-hat drum
					</button>
				</div>
			</div>
			<div className="mb-2">
				<p className="font-medium text-xl mb-1">Notes</p>
				<div className="flex flex-wrap gap-y-1.5 gap-x-1.5 items-center">
					{notes.map(({ name, frequency }) => (
						<button className="border rounded-lg p-1 focus:outline-none focus:ring" key={frequency} onClick={() => playNote(frequency)}>
							{name}
						</button>
					))}
				</div>
			</div>
			<canvas ref={canvasRef} className="w-full h-[100px]" />
		</div>
	)
}

export function getStaticProps() {
	return { props: {} }
}

export default Index
