import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MembersSearchBar } from '../MembersSearchBar';

describe('MembersSearchBar', () => {
  it('renderiza o input com placeholder padrão e acessibilidade', () => {
    const handleChange = vi.fn();
    render(<MembersSearchBar value="" onChange={handleChange} />);

    const input = screen.getByRole('searchbox', { name: 'Buscar membros por nome' });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Nome do membro…');
  });

  it('dispara onChange após debounce de 300ms ao digitar', () => {
    vi.useFakeTimers();
    const handleChange = vi.fn();
    render(<MembersSearchBar value="" onChange={handleChange} />);

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'Lucas' } });

    // Antes de 300ms não deve ter chamado
    expect(handleChange).not.toHaveBeenCalled();

    // Avança 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(handleChange).toHaveBeenCalledWith('Lucas');
    vi.useRealTimers();
  });

  it('dispara callback imediatamente no submit do formulário', () => {
    const handleChange = vi.fn();
    render(<MembersSearchBar value="Marcos" onChange={handleChange} />);

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'Mateus' } });

    // Submit do form
    const form = screen.getByRole('search');
    fireEvent.submit(form);

    expect(handleChange).toHaveBeenCalledWith('Mateus');
  });

  it('exibe botão de limpar quando há valor e reseta ao clicar', () => {
    const handleChange = vi.fn();
    render(<MembersSearchBar value="Texto existente" onChange={handleChange} />);

    const clearButton = screen.getByRole('button', { name: 'Limpar busca' });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });
});
