use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn best_move(board: &[i32]) -> usize {
    fn check_win(board: &[i32]) -> i32 {
        let wins = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6],
        ];
        for w in wins.iter() {
            if board[w[0]] != 0 && board[w[0]] == board[w[1]] && board[w[1]] == board[w[2]] {
                return board[w[0]];
            }
        }
        0
    }

    fn minimax(board: &mut [i32], depth: i32, player: i32, alpha: &mut i32, beta: &mut i32) -> i32 {
        let winner = check_win(board);
        if winner != 0 {
            return winner * (10 - depth);
        }
        if !board.contains(&0) {
            return 0;
        }

        let mut best = if player == 1 { i32::MIN } else { i32::MAX };
        for i in 0..9 {
            if board[i] == 0 {
                board[i] = player;
                let score = minimax(board, depth + 1, -player, alpha, beta);
                board[i] = 0;

                if player == 1 {
                    best = best.max(score);
                    *alpha = (*alpha).max(best);
                } else {
                    best = best.min(score);
                    *beta = (*beta).min(best);
                }
                if *beta <= *alpha {
                    break;
                }
            }
        }
        best
    }

    let mut best_score = i32::MAX;
    let mut move_idx = 0;
    let mut board_copy = board.to_vec();

    for i in 0..9 {
        if board_copy[i] == 0 {
            board_copy[i] = -1;
            let mut a = i32::MIN;
            let mut b = i32::MAX;
            let score = minimax(&mut board_copy, 0, 1, &mut a, &mut b);
            board_copy[i] = 0;
            if score < best_score {
                best_score = score;
                move_idx = i;
            }
        }
    }

    move_idx
}
