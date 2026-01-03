import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { CellState } from '../../../core/models/cell-state.enum';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class BoardComponent {
  board = input.required<CellState[][]>();
  isOpponent = input<boolean>(false);
  isInteractive = input<boolean>(true);
  highlightCell = input<{ x: number; y: number } | null>(null);

  cellClick = output<{ x: number; y: number }>();

  onCellClick(x: number, y: number): void {
    if (this.isInteractive()) {
      this.cellClick.emit({ x, y });
    }
  }

  getCellClass(x: number, y: number): string {
    const cell = this.board()[y][x];
    const classes: string[] = ['cell'];

    // For opponent board, hide ships
    if (this.isOpponent() && cell === CellState.SHIP) {
      classes.push('cell-empty');
    } else {
      classes.push(`cell-${cell}`);
    }

    // Highlight cell if specified
    if (this.highlightCell() && this.highlightCell()!.x === x && this.highlightCell()!.y === y) {
      classes.push('cell-highlight');
    }

    // Add hover effect for interactive boards
    if (this.isInteractive() && this.isOpponent()) {
      classes.push('cell-hover');
    }

    return classes.join(' ');
  }

  trackByIndex(index: number): number {
    return index;
  }
}
