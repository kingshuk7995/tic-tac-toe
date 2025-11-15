#include <algorithm>
#include <cstdint>
#include <emscripten/emscripten.h>
#include <vector>

extern "C" {

constexpr int LINES[8][3] = {{0, 1, 2}, {3, 4, 5}, {6, 7, 8}, {0, 3, 6},
                             {1, 4, 7}, {2, 5, 8}, {0, 4, 8}, {2, 4, 6}};

inline int evaluate(const std::vector<int> &b) {
  for (int li = 0; li < 8; ++li) {
    int a = LINES[li][0];
    int c = LINES[li][1];
    int d = LINES[li][2];
    int s = b[a] + b[c] + b[d];
    if (s == 3)
      return 1;
    if (s == -3)
      return -1;
  }
  return 0;
}

inline int encode_board_key(const std::vector<int> &b) {
  int key = 0;
  for (int i = 0; i < 9; ++i) {
    int digit = b[i] + 1; // -1->0, 0->1, 1->2
    key = key * 3 + digit;
  }
  return key;
}

static int8_t cache_table[19683][2];

inline void init_cache_if_needed() {
  static bool inited = false;
  if (!inited) {
    for (int i = 0; i < 19683; ++i) {
      cache_table[i][0] = cache_table[i][1] = -2;
    }
    inited = true;
  }
}

int negamax(std::vector<int> &b, int player, int alpha, int beta, int depth) {
  if (depth > 12)
    return 0;

  int score = evaluate(b);
  if (score != 0) {
    return score * player;
  }

  bool hasMove = false;
  for (int i = 0; i < 9; ++i)
    if (b[i] == 0) {
      hasMove = true;
      break;
    }
  if (!hasMove)
    return 0;

  init_cache_if_needed();
  int key = encode_board_key(b);
  int pidx = (player == 1) ? 1 : 0;
  int8_t cached = cache_table[key][pidx];
  if (cached != -2) {
    return (int)cached;
  }

  int best = -1000;
  for (int i = 0; i < 9; ++i) {
    if (b[i] == 0) {
      b[i] = player;
      int val = -negamax(b, -player, -beta, -alpha, depth + 1);
      b[i] = 0;
      if (val > best)
        best = val;
      alpha = std::max(alpha, val);
      if (alpha >= beta)
        break;
    }
  }

  if (best < -1)
    best = -1;
  if (best > 1)
    best = 1;
  cache_table[key][pidx] = static_cast<int8_t>(best);
  return best;
}

EMSCRIPTEN_KEEPALIVE
int best_move(int *board_ptr, int n, int ai_player) {
  if (n != 9)
    return -1;

  std::vector<int> b(9);
  for (int i = 0; i < 9; ++i)
    b[i] = board_ptr[i];

  init_cache_if_needed();

  int bestVal = -1000;
  int bestIdx = -1;

  int term = evaluate(b);
  if (term != 0)
    return -1;
  bool any = false;
  for (int i = 0; i < 9; ++i)
    if (b[i] == 0) {
      any = true;
      break;
    }
  if (!any)
    return -1;

  for (int i = 0; i < 9; ++i) {
    if (b[i] == 0) {
      b[i] = ai_player;
      int val = -negamax(b, -ai_player, -1000, 1000, 0);
      b[i] = 0;
      if (val > bestVal) {
        bestVal = val;
        bestIdx = i;
      }
    }
  }

  return bestIdx;
}
}
