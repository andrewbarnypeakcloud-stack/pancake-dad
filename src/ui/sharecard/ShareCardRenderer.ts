// ShareCardRenderer — Canvas API screenshot of score, Web Share API on mobile, download on desktop
// See PancakeDad_GDD_v02_Browser.md section 8.4

import Phaser from 'phaser';
import { ShareCardData } from '../../types/ui';

/** Share card canvas dimensions */
const CARD_WIDTH = 600;
const CARD_HEIGHT = 400;

/** Background color matching game theme */
const BG_COLOR = '#1a1a2e';
const ACCENT_COLOR = '#f5a623';
const TEXT_COLOR = '#ffffff';
const MUTED_COLOR = '#888888';

/** ShareCardRenderer — renders a branded result card to an off-screen canvas.
 *  On mobile, uses the Web Share API (navigator.share).
 *  On desktop, offers the image as a PNG download. */
export class ShareCardRenderer {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Render the share card and trigger share/download */
  renderAndShare(data: ShareCardData): void {
    const canvas = this.renderCard(data);
    this.shareOrDownload(canvas, data);
  }

  /** Render the share card to an off-screen canvas and return it */
  renderCard(data: ShareCardData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // ── Background ──
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // ── Accent strip at top ──
    ctx.fillStyle = ACCENT_COLOR;
    ctx.fillRect(0, 0, CARD_WIDTH, 6);

    // ── Game Logo ──
    ctx.fillStyle = ACCENT_COLOR;
    ctx.font = 'bold 36px Arial Black, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PANCAKE DAD', CARD_WIDTH / 2, 50);

    // ── Subtitle / Dad Name ──
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText(`${data.dadName} at ${data.levelName}`, CARD_WIDTH / 2, 80);

    // ── Score (large) ──
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 64px Arial Black, Arial, sans-serif';
    ctx.fillText(data.score.toLocaleString(), CARD_WIDTH / 2, 160);

    // ── "POINTS" label ──
    ctx.fillStyle = MUTED_COLOR;
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('POINTS', CARD_WIDTH / 2, 185);

    // ── New High Score badge ──
    if (data.isHighScore) {
      ctx.fillStyle = ACCENT_COLOR;
      ctx.font = 'bold 20px Arial Black, Arial, sans-serif';
      ctx.fillText('NEW HIGH SCORE!', CARD_WIDTH / 2, 215);
    }

    // ── Stats Row ──
    const statsY = 260;
    const statWidth = CARD_WIDTH / 3;

    // Max Combo
    this.drawStat(ctx, statWidth * 0.5, statsY, `x${data.comboMax}`, 'MAX COMBO');

    // Tricks Landed
    if (data.tricksLanded !== undefined) {
      this.drawStat(ctx, statWidth * 1.5, statsY, `${data.tricksLanded}`, 'TRICKS');
    }

    // Dad Bucks Earned
    if (data.dadBucksEarned !== undefined) {
      this.drawStat(ctx, statWidth * 2.5, statsY, `${data.dadBucksEarned}`, 'DAD BUCKS');
    }

    // ── Divider ──
    ctx.strokeStyle = '#333355';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 310);
    ctx.lineTo(CARD_WIDTH - 40, 310);
    ctx.stroke();

    // ── Call to action ──
    ctx.fillStyle = MUTED_COLOR;
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Can you beat this? Play free at:', CARD_WIDTH / 2, 340);

    ctx.fillStyle = ACCENT_COLOR;
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText('pancakedad.game', CARD_WIDTH / 2, 365);

    // ── Bottom accent strip ──
    ctx.fillStyle = ACCENT_COLOR;
    ctx.fillRect(0, CARD_HEIGHT - 4, CARD_WIDTH, 4);

    return canvas;
  }

  /** Draw a stat column (value + label) */
  private drawStat(ctx: CanvasRenderingContext2D, x: number, y: number, value: string, label: string): void {
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 28px Arial Black, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(value, x, y);

    ctx.fillStyle = MUTED_COLOR;
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(label, x, y + 20);
  }

  /** Share on mobile (Web Share API) or download on desktop */
  private shareOrDownload(canvas: HTMLCanvasElement, data: ShareCardData): void {
    canvas.toBlob((blob) => {
      if (!blob) return;

      // Try Web Share API first (mobile)
      if (this.canShare()) {
        this.webShare(blob, data);
      } else {
        this.downloadImage(blob, data);
      }
    }, 'image/png');
  }

  /** Check if Web Share API is available */
  private canShare(): boolean {
    return typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function';
  }

  /** Use Web Share API to share the image */
  private webShare(blob: Blob, data: ShareCardData): void {
    const file = new File([blob], 'pancake-dad-score.png', { type: 'image/png' });
    const shareData: ShareData = {
      title: 'Pancake Dad',
      text: `I scored ${data.score.toLocaleString()} points in Pancake Dad as ${data.dadName}! Can you beat it?`,
      files: [file],
    };

    // Check if files can be shared
    if (navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(() => {
        // User cancelled or error — fall back to download
        this.downloadImage(blob, data);
      });
    } else {
      // Can't share files — try without files
      const textOnly: ShareData = {
        title: 'Pancake Dad',
        text: `I scored ${data.score.toLocaleString()} in Pancake Dad! Play at pancakedad.game`,
        url: 'https://pancakedad.game',
      };
      navigator.share(textOnly).catch(() => {
        this.downloadImage(blob, data);
      });
    }
  }

  /** Download the image as a PNG file (desktop fallback) */
  private downloadImage(blob: Blob, _data: ShareCardData): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pancake-dad-score.png';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Clean up
    this.scene.time.delayedCall(100, () => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }
}
