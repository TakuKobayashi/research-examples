import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WebRTC Sample App',
  description: 'WebRTC video chat and data channel sample without TURN server',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
