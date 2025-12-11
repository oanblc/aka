import '../styles/globals.css'
import { Inter } from 'next/font/google'
import { SettingsProvider } from '../contexts/SettingsContext'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function App({ Component, pageProps }) {
  return (
    <SettingsProvider>
      <div className={`${inter.variable} font-sans`}>
        <Component {...pageProps} />
      </div>
    </SettingsProvider>
  )
}

