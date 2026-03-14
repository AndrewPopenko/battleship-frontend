import { CellState } from '../../core/models/cell-state.enum';

export interface ShipPlacement {
  shipId: string;
  x: number;
  y: number;
  orientation: 'horizontal' | 'vertical';
}

export function createEmptyBoard(): CellState[][] {
  return Array(10)
    .fill(null)
    .map(() => Array(10).fill(CellState.EMPTY));
}

export function isValidPlacement(
  board: CellState[][],
  x: number,
  y: number,
  size: number,
  orientation: 'horizontal' | 'vertical',
): boolean {
  // Check if ship fits on board
  if (orientation === 'horizontal') {
    if (x + size > 10) return false;
  } else {
    if (y + size > 10) return false;
  }

  // Check if cells are empty and adjacent cells are empty
  for (let i = 0; i < size; i++) {
    const checkX = orientation === 'horizontal' ? x + i : x;
    const checkY = orientation === 'vertical' ? y + i : y;

    // Check the cell itself and all adjacent cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const adjX = checkX + dx;
        const adjY = checkY + dy;

        if (adjX >= 0 && adjX < 10 && adjY >= 0 && adjY < 10) {
          if (board[adjY][adjX] === CellState.SHIP) {
            return false;
          }
        }
      }
    }
  }

  return true;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDefaultShips(): Array<{ id: string; size: number; name: string }> {
  return [
    { id: generateUUID(), size: 4, name: 'Battleship' },
    { id: generateUUID(), size: 3, name: 'Cruiser 1' },
    { id: generateUUID(), size: 3, name: 'Cruiser 2' },
    { id: generateUUID(), size: 2, name: 'Destroyer 1' },
    { id: generateUUID(), size: 2, name: 'Destroyer 2' },
    { id: generateUUID(), size: 2, name: 'Destroyer 3' },
    { id: generateUUID(), size: 1, name: 'Boat 1' },
    { id: generateUUID(), size: 1, name: 'Boat 2' },
    { id: generateUUID(), size: 1, name: 'Boat 3' },
    { id: generateUUID(), size: 1, name: 'Boat 4' },
  ];
}

export function boardToString(board: CellState[][]): string {
  return board
    .map((row) =>
      row
        .map((cell) => {
          switch (cell) {
            case CellState.EMPTY:
              return '·';
            case CellState.SHIP:
              return 'S';
            case CellState.HIT:
              return 'X';
            case CellState.MISS:
              return 'O';
            default:
              return '?';
          }
        })
        .join(' '),
    )
    .join('\n');
}
