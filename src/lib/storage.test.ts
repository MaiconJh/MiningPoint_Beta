import { describe, it, expect } from 'vitest';
import {
  validateImageFile,
  MAX_IMAGE_BYTES,
  ACCEPTED_IMAGE_TYPES,
} from './storage';

describe('validateImageFile', () => {
  it('retorna válido para arquivo JPEG com tamanho abaixo do limite', () => {
    const file = new File(['conteudo-teste'], 'foto.jpg', { type: 'image/jpeg' });
    const result = validateImageFile(file);

    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('retorna válido para formatos aceitos (PNG e WebP)', () => {
    const pngFile = new File(['png-data'], 'avatar.png', { type: 'image/png' });
    const webpFile = new File(['webp-data'], 'banner.webp', { type: 'image/webp' });

    expect(validateImageFile(pngFile).valid).toBe(true);
    expect(validateImageFile(webpFile).valid).toBe(true);
  });

  it('retorna válido para arquivo com exatamente 5 MB', () => {
    // 5 * 1024 * 1024 bytes
    const blob = new Blob([new Uint8Array(MAX_IMAGE_BYTES)], { type: 'image/jpeg' });
    const file = new File([blob], 'limite-exato.jpg', { type: 'image/jpeg' });

    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('retorna inválido para formatos não aceitos (ex: GIF ou PDF)', () => {
    const gifFile = new File(['gif-data'], 'animacao.gif', { type: 'image/gif' });
    const pdfFile = new File(['pdf-data'], 'documento.pdf', { type: 'application/pdf' });

    const gifResult = validateImageFile(gifFile);
    expect(gifResult.valid).toBe(false);
    expect(gifResult.reason).toBe('Formato não aceito. Use JPG, PNG ou WebP.');

    const pdfResult = validateImageFile(pdfFile);
    expect(pdfResult.valid).toBe(false);
    expect(pdfResult.reason).toBe('Formato não aceito. Use JPG, PNG ou WebP.');
  });

  it('retorna inválido para arquivo com 1 byte acima do limite de 5 MB', () => {
    const blob = new Blob([new Uint8Array(MAX_IMAGE_BYTES + 1)], { type: 'image/jpeg' });
    const file = new File([blob], 'acima-do-limite.jpg', { type: 'image/jpeg' });

    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Arquivo muito grande (5,0 MB). O limite é 5 MB.');
  });

  it('formata o tamanho com uma casa decimal e vírgula na mensagem de erro', () => {
    // Exemplo: 7.4 MB = Math.round(7.4 * 1024 * 1024) bytes
    const bytes = Math.round(7.4 * 1024 * 1024);
    const blob = new Blob([new Uint8Array(bytes)], { type: 'image/png' });
    const file = new File([blob], 'grande.png', { type: 'image/png' });

    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Arquivo muito grande (7,4 MB). O limite é 5 MB.');
  });
});
