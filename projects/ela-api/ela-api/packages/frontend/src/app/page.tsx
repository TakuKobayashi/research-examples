import ElaAnalyzer from '@/components/ElaAnalyzer';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={`${styles.root} grid-bg`}>
      {/* Scanline effect */}
      <div className={styles.scanline} aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoBracket}>&#x25C6;</span>
            <span className={styles.logoText}>ELA Inspector</span>
          </div>
          <nav className={styles.nav}>
            <a href="/api-reference.html" target="_blank" rel="noopener noreferrer" className={styles.navLink}>
              API Reference
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.navLink}>
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            IMAGE FORENSICS TOOL
          </div>
          <h1 className={styles.heroTitle}>
            Error Level
            <br />
            <span className={styles.heroTitleAccent}>Analysis</span>
          </h1>
          <p className={styles.heroDesc}>
            画像の改ざん・合成箇所をピクセルレベルで可視化する
            <br />
            フォレンジクス解析ツール
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>JPEG</span>
              <span className={styles.heroStatLabel}>PNG / WebP</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>10MB</span>
              <span className={styles.heroStatLabel}>最大ファイルサイズ</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>Workers</span>
              <span className={styles.heroStatLabel}>Cloudflare</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main tool */}
      <main className={styles.main}>
        <div className={styles.mainInner}>
          <ElaAnalyzer />
        </div>
      </main>

      {/* How it works */}
      <section className={styles.howto}>
        <div className={styles.howtoInner}>
          <div className={styles.sectionLabel}>HOW IT WORKS</div>
          <h2 className={styles.sectionTitle}>ELA の仕組み</h2>
          <div className={styles.steps}>
            {[
              {
                num: '01',
                title: '再圧縮',
                body: '元画像を指定した JPEG 品質で再圧縮します。編集済み領域は品質劣化が少なく、未編集領域との差が生まれます。',
              },
              {
                num: '02',
                title: '差分計算',
                body: '元画像と再圧縮画像のピクセル単位の絶対差分を RGB チャンネルごとに計算します。',
              },
              {
                num: '03',
                title: '増幅・可視化',
                body: '微小な差分を増幅係数でスケールし、人間の目で確認できる形に可視化します。明るい = 疑い箇所',
              },
            ].map((step) => (
              <div key={step.num} className={styles.step}>
                <div className={styles.stepNum}>{step.num}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepBody}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API section */}
      <section className={styles.apiSection}>
        <div className={styles.apiInner}>
          <div className={styles.sectionLabel}>API</div>
          <h2 className={styles.sectionTitle}>REST API</h2>
          <div className={styles.apiCard}>
            <div className={styles.apiEndpoint}>
              <span className={styles.apiMethod}>POST</span>
              <span className={styles.apiPath}>/api/ela</span>
            </div>
            <pre className={styles.apiCode}>{`curl -X POST \\
  -F "image=@photo.jpg" \\
  -F "quality=75" \\
  -F "scale=10" \\
  https://your-worker.workers.dev/api/ela \\
  --output ela-result.png`}</pre>
            <a
              href="/api-reference.html"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.apiRefLink}
            >
              API リファレンスを見る →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerText}>ELA Inspector — Built with Hono + Cloudflare Workers</span>
          <div className={styles.footerLinks}>
            <a href="/api-reference.html" target="_blank" rel="noopener noreferrer">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
