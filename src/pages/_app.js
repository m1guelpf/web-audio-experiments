import 'tailwindcss/tailwind.css'
import Head from 'next/head'

function MyApp({ Component, pageProps }) {
	return (
		<>
			<Head>
				<title>Web Audio Experiments</title>
				<meta name="title" content="Web Audio Experiments" />
				<meta name="description" content="Making a simple synth with nothing but white noise and Web APIs to learn how sound works." />

				<meta property="og:type" content="website" />
				<meta property="og:url" content="https://web-audio-experiments.m1guelpf.me/" />
				<meta property="og:title" content="Web Audio Experiments" />
				<meta property="og:description" content="Making a simple synth with nothing but white noise and Web APIs to learn how sound works." />
				<meta property="og:image" content="https://web-audio-experiments.m1guelpf.me/card.jpg" />

				<meta property="twitter:card" content="summary_large_image" />
				<meta property="twitter:url" content="https://web-audio-experiments.m1guelpf.me/" />
				<meta property="twitter:title" content="Web Audio Experiments" />
				<meta property="twitter:description" content="Making a simple synth with nothing but white noise and Web APIs to learn how sound works." />
				<meta property="twitter:image" content="https://web-audio-experiments.m1guelpf.me/card.jpg" />
			</Head>
			<Component {...pageProps} />
		</>
	)
}

export default MyApp
