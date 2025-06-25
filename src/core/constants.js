import { contains } from "jquery";

const WIREFRAME = false;
const SHADOW = false;
const BLACK = 0;
const WHITE = 1;
const FEEDBACK = 2;
const DEBUG = false;
const BOARD_SIZE = 100;
const PIECE_SIZE = 0.4;
const FLOOR_SIZE = 2000;
const COLS = 8;
const ROWS = 8;
const LOADING_BAR_SCALE = 0.3;
const LEVELS = [
	{ timeout: 0, maxply: 1 },
	{ timeout: 12, maxply: 20 },
	{ timeout: 25, maxply: 40 },
	{ timeout: 50, maxply: 60 },
	{ timeout: 100, maxply: 80 },
	{ timeout: 200, maxply: 100 },
	{ timeout: 400, maxply: 120 },
	{ timeout: 800, maxply: 140 },
	{ timeout: 1600, maxply: 160 },
	{ timeout: 3200, maxply: 180 }
];

export {
    WIREFRAME,
    SHADOW,
    BLACK,
    WHITE,
    FEEDBACK,
    DEBUG,
    BOARD_SIZE,
    PIECE_SIZE,
    FLOOR_SIZE,
    COLS,
    ROWS,
    LOADING_BAR_SCALE,
    LEVELS,
    LEVELS as levels // keep old name in export for compatibility
};