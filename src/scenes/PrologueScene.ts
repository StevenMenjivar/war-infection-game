import Phaser from 'phaser';

interface DialogueLine { speaker: string; text: string; }

export class PrologueScene extends Phaser.Scene {
  private lines: DialogueLine[] = [];
  private lineIndex = 0;
  private visibleWords = 0;
  private words: string[] = [];
  private dialogueText!: Phaser.GameObjects.Text;
  private speakerText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private typingTimer?: Phaser.Time.TimerEvent;
  private finished = false;

  constructor() { super('PrologueScene'); }

  create(): void {
    const name = String(this.registry.get('playerName') ?? 'Soldado');
    this.lines = [
      { speaker: 'CAPITÁN MILLER', text: `Soldado ${name} cuál es la situación del pelotón?.` },
      { speaker: name.toUpperCase(), text: 'Capitán Miller, la misión de reconocimiento, ha cambiado de parecer [inteligible...] estamos recibiendo fuego amigo por parte del escuadrón Centauro en la base Alfa-B. Parece que algo los ha afectado, no parecen ser conscientes, pareciera que estuvieron demasiado expuestos a la investigación del elemento HK. No hay energía ni comunicación interna.' },
      { speaker: 'CAPITÁN MILLER', text: `${name}, abandone inmediatamente el lugar y llegue a la zona de extracción de la sección sur. Un convoy de rescate llegará a las 0400.` },
      { speaker: 'CAPITÁN MILLER', text: `${name}, responda!.` },
      { speaker: name.toUpperCase(), text: 'Demasiado tarde (No signal sound)...' },
    ];

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#070b09');
    const g = this.add.graphics();
    g.fillGradientStyle(0x17231b, 0x17231b, 0x070b09, 0x070b09, 0.7);
    g.fillRect(0, 0, width, height);
    g.lineStyle(1, 0x607361, 0.18);
    for (let x = 0; x < width; x += 40) g.lineBetween(x, 0, x, height);
    this.add.text(70, 54, 'WAR INFECTION  /  REGISTRO DE COMUNICACIONES', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9db19f', letterSpacing: 2,
    });
    this.add.text(width - 70, 54, 'ARCHIVO HK-04  //  AUDIO TRANSCRITO', {
      fontFamily: 'monospace', fontSize: '10px', color: '#687b6d', letterSpacing: 1,
    }).setOrigin(1, 0);
    this.add.rectangle(width / 2, height / 2 + 28, width - 140, 390, 0x0c1410, 0.92).setStrokeStyle(1, 0x415446, 0.8);
    this.add.rectangle(70, height / 2 - 167, 5, 335, 0xb94a42, 0.9).setOrigin(0, 0);
    this.speakerText = this.add.text(110, height / 2 - 130, '', {
      fontFamily: 'monospace', fontSize: '15px', color: '#b5d58a', fontStyle: 'bold', letterSpacing: 1,
    });
    this.dialogueText = this.add.text(110, height / 2 - 85, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '23px', color: '#e0e8e1',
      wordWrap: { width: width - 260 }, lineSpacing: 12,
    }).setOrigin(0, 0);
    this.hintText = this.add.text(width / 2, height - 90, 'ENTER  ·  CONTINUAR', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9fb28e', letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0);
    this.add.text(70, height - 44, 'CANAL INESTABLE  //  BASE ALFA-B', {
      fontFamily: 'monospace', fontSize: '10px', color: '#607165', letterSpacing: 1,
    });

    this.input.keyboard?.on('keydown-ENTER', this.advance, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ENTER', this.advance, this);
      this.typingTimer?.remove();
    });
    this.showLine();
  }

  private showLine(): void {
    const line = this.lines[this.lineIndex];
    this.speakerText.setText(line.speaker);
    this.words = line.text.split(/\s+/);
    this.visibleWords = 0;
    this.dialogueText.setText('');
    this.hintText.setAlpha(0);
    this.finished = false;
    this.typingTimer?.remove();
    this.typingTimer = this.time.addEvent({
      delay: 105,
      repeat: this.words.length - 1,
      callback: () => {
        this.visibleWords++;
        this.dialogueText.setText(this.words.slice(0, this.visibleWords).join(' '));
        if (this.visibleWords >= this.words.length) this.finishLine();
      },
    });
  }

  private finishLine(): void {
    this.finished = true;
    this.typingTimer?.remove();
    this.hintText.setAlpha(1);
  }

  private advance(): void {
    if (!this.finished) { this.dialogueText.setText(this.lines[this.lineIndex].text); this.finishLine(); return; }
    this.lineIndex++;
    if (this.lineIndex < this.lines.length) this.showLine();
    else {
      this.hintText.setText('PRESIONA ENTER PARA CONTINUAR...');
      this.hintText.setAlpha(1);
      this.input.keyboard?.off('keydown-ENTER', this.advance, this);
      this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('GameScene'));
    }
  }
}
