import type Phaser from 'phaser';

/** Capa de audio preparada para integrar archivos cuando estén disponibles. */
export class AudioManager {
  constructor(private readonly scene: Phaser.Scene) {}

  play(_key: string, _config?: Phaser.Types.Sound.SoundConfig): void {
    // No-op intencional: el paquete actual no contiene archivos de audio.
    // Se evita generar errores mientras no se integren sonidos.
    void this.scene;
  }

  stopAll(): void {
    // Reservado para detener sonidos administrados por este manager.
  }
}
