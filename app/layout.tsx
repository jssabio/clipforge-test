import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClipForge — Video Prep Studio',
  description: 'Prepare and compress videos in your browser. Your files stay on your device during processing.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
