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

const canvasWidth = 1000
const canvasHeight = 100

const Index = () => {
	if (typeof window === 'undefined') return <span>loading...</span>

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

		const canvasCtx = canvasRef.current.getContext('2d')
		canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight)

		const drawAnalyserFrame = () => {
			requestAnimationFrame(draw)

			analyser.getByteTimeDomainData(dataArray)
			canvasCtx.fillStyle = 'rgb(200, 200, 200)'
			canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight)
			canvasCtx.lineWidth = 2
			canvasCtx.strokeStyle = 'rgb(0, 0, 0)'
			canvasCtx.beginPath()

			var sliceWidth = (canvasWidth * 1.0) / analyser.frequencyBinCount
			var x = 0

			for (var i = 0; i < analyser.frequencyBinCount; i++) {
				var v = dataArray[i] / 128.0
				var y = (v * canvasHeight) / 2

				if (i === 0) canvasCtx.moveTo(x, y)
				else canvasCtx.lineTo(x, y)

				x += sliceWidth
			}
			canvasCtx.lineTo(canvasWidth, canvasHeight / 2)
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
		<div>
			<button onClick={playWhiteNoise}>white noise</button>
			<button onClick={playSnareDrum}>snare drum</button>
			<button onClick={playKickDrum}>kick drum</button>
			<button onClick={playHiHat}>hi-hat drum</button>
			<div style={{ border: '1px dotted black', padding: '1rem' }}>
				{notes.map(({ name, frequency }) => (
					<button key={frequency} onClick={() => playNote(frequency)} style={{ marginRight: '10px' }}>
						{name}
					</button>
				))}
			</div>
			<canvas ref={canvasRef} style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }} />
		</div>
	)
}

export default Index
