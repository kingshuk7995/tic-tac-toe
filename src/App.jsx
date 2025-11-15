import React, { useEffect, useRef, useState } from "react";

export default function App() {
  const moduleRef = useRef(null);

  const [board, setBoard] = useState(Array(9).fill(0));
  const [xIsNext, setXIsNext] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!window.createMinMaxModule) return;

      const M = await window.createMinMaxModule({
        onRuntimeInitialized() {}
      });
      
      await new Promise((resolve, reject) => {
        const t0 = performance.now();
        const wait = () => {
          if (M.HEAP32 && M.HEAPU8) resolve();
          else if (performance.now() - t0 > 1200) reject();
          else setTimeout(wait, 8);
        };
        wait();
      });

      const bestMoveWrapped =
        typeof M.cwrap === "function"
          ? M.cwrap("best_move", "number", ["number", "number", "number"])
          : (ptr, n, p) =>
              M.ccall("best_move", "number", ["number", "number", "number"], [ptr, n, p]);

      if (mounted) moduleRef.current = { M, bestMoveWrapped };
    }

    load();
    return () => (mounted = false);
  }, []);

  function evaluate(b) {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (const [a, b2, c] of lines) {
      const s = b[a] + b[b2] + b[c];
      if (s === 3) return { winner: 1, line: [a,b2,c] };
      if (s === -3) return { winner: -1, line: [a,b2,c] };
    }
    return { winner: 0, line: [] };
  }

  const evalRes = evaluate(board);
  const { winner, line } = evalRes;

  const status = (() => {
    if (winner === 1) return "You win!";
    if (winner === -1) return "AI wins!";
    if (!board.includes(0)) return "Draw!";
    return xIsNext ? "Your turn" : "AI is thinking…";
  })();

  function handleClick(i) {
    if (!xIsNext) return;
    if (board[i] !== 0) return;
    if (winner !== 0) return;

    const nb = [...board];
    nb[i] = 1;
    setBoard(nb);
    setXIsNext(false);

    setTimeout(() => aiMove(nb), 150);
  }

  async function aiMove(currentBoard) {
    const ref = moduleRef.current;
    if (!ref) return;

    setLoadingAI(true);
    const { M, bestMoveWrapped } = ref;

    const ptr = M._malloc(9 * 4);
    const heap32 = new Int32Array(M.HEAP32.buffer, ptr, 9);

    for (let i = 0; i < 9; i++) heap32[i] = currentBoard[i];

    const mv = bestMoveWrapped(ptr, 9, -1);
    M._free(ptr);

    if (mv >= 0 && currentBoard[mv] === 0) {
      const nb = [...currentBoard];
      nb[mv] = -1;
      setBoard(nb);
      setXIsNext(true);
    }

    setLoadingAI(false);
  }

  function reset() {
    setBoard(Array(9).fill(0));
    setXIsNext(true);
    setLoadingAI(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">

      <div className="w-full max-w-sm space-y-4 select-none">

        <h1 className="text-3xl font-extrabold text-center tracking-tight text-gray-700 drop-shadow-sm">
          Tic-Tac-Toe
        </h1>

        <h2
          className={
            "text-center text-lg font-semibold transition " +
            (xIsNext ? "text-blue-600" : "text-red-600")
          }
        >
          {status}
        </h2>

        <div className="bg-white p-5 rounded-3xl shadow-xl">
          <div className="grid grid-cols-3 gap-3">
            {board.map((v, i) => {
              const highlight = line.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => handleClick(i)}
                  disabled={v !== 0 || winner !== 0}
                  className={
                    "aspect-square flex items-center justify-center rounded-2xl text-5xl font-bold transition-all " +
                    (highlight
                      ? "bg-yellow-300 text-gray-800 animate-pulse"
                      : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300")
                  }
                >
                  {v === 1 ? (
                    <span className="text-blue-600 drop-shadow">X</span>
                  ) : v === -1 ? (
                    <span className="text-red-600 drop-shadow">O</span>
                  ) : (
                    ""
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex justify-center">
            <button
              onClick={reset}
              className="px-6 py-2 rounded-xl bg-gray-700 text-white font-semibold shadow hover:bg-gray-800 active:scale-95 transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
